import { jest } from "@jest/globals";

process.env.GROQ_API_KEY = "dummy-test-key";

await jest.unstable_mockModule("groq-sdk", () => {
  const create = jest.fn();
  const MockGroq = jest.fn().mockImplementation(() => ({
    chat: { completions: { create } },
  }));
  MockGroq._create = create;
  return { default: MockGroq };
});

const { default: GroqSDK } = await import("groq-sdk");
const {
  callLlm,
  parseJsonResponse,
  runMixtureOfExperts,
  createThesisAlignmentMoE,
  createPitchAnalysisMoE,
} = await import("../services/llmservice.js");

const mockCreate = GroqSDK._create;

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore();
  console.warn.mockRestore();
  console.error.mockRestore();
});

function groqResponse(text) {
  return {
    choices: [{ message: { content: text } }],
  };
}

const baseProject = {
  id: "proj-1",
  title: "AgroSense",
  tagline: "AI-powered crop monitoring",
  shortDesc: "Satellite + IoT crop health analysis.",
  fullDesc:
    "AgroSense uses multi-spectral imaging and edge AI to detect crop disease early.",
  stage: "Seed",
  industry: "AgriTech",
  technologies: ["AI", "IoT", "Satellite"],
  fundingSought: 500000,
  currency: "USD",
  teamMembers: [
    { name: "Alice", role: "CEO" },
    { name: "Bob", role: "CTO" },
  ],
  milestones: [
    { title: "MVP", completedAt: "2024-01-01" },
    { title: "Pilot", completedAt: null },
  ],
  updates: [{ id: 1 }, { id: 2 }],
};

const baseInvestorProfile = {
  fundingMin: 100000,
  fundingMax: 1000000,
  currency: "USD",
  stages: ["Seed", "Series A"],
  investmentThesis: "Focus on climate-tech and sustainable agriculture.",
  mustHaves: { sector: "AgriTech" },
  exclusions: { sector: "Gambling" },
};

const baseAssessment = { trlScore: 4, irScore: 72 };

describe("callLlm — mocking & prompt shape", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  test("returns trimmed text content from the SDK response", async () => {
    mockCreate.mockResolvedValueOnce(groqResponse("  hello world  "));

    const result = await callLlm("Say hi", "You are helpful.");

    expect(result).toBe("hello world");
  });

  test("never reaches the real Groq network (mock intercepts)", async () => {
    mockCreate.mockResolvedValueOnce(groqResponse("ok"));

    await callLlm("prompt", "system");

    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  test("sends system prompt as first message with role=system", async () => {
    mockCreate.mockResolvedValueOnce(groqResponse("ok"));

    await callLlm("user prompt here", "You are an expert.");

    const { messages } = mockCreate.mock.calls[0][0];
    expect(messages[0]).toEqual({
      role: "system",
      content: "You are an expert.",
    });
  });

  test("sends user prompt as second message with role=user", async () => {
    mockCreate.mockResolvedValueOnce(groqResponse("ok"));

    await callLlm("my question", "system text");

    const { messages } = mockCreate.mock.calls[0][0];
    expect(messages[1]).toEqual({ role: "user", content: "my question" });
  });

  test("uses the correct model name", async () => {
    mockCreate.mockResolvedValueOnce(groqResponse("ok"));

    await callLlm("prompt", "system");

    const { model } = mockCreate.mock.calls[0][0];
    expect(model).toBe("llama-3.1-8b-instant");
  });

  test("defaults max_tokens to 1000 when not provided", async () => {
    mockCreate.mockResolvedValueOnce(groqResponse("ok"));

    await callLlm("prompt", "system");

    const { max_tokens } = mockCreate.mock.calls[0][0];
    expect(max_tokens).toBe(1000);
  });

  test("respects a custom maxTokens argument", async () => {
    mockCreate.mockResolvedValueOnce(groqResponse("ok"));

    await callLlm("prompt", "system", 300);

    const { max_tokens } = mockCreate.mock.calls[0][0];
    expect(max_tokens).toBe(300);
  });

  test("uses temperature 0.3", async () => {
    mockCreate.mockResolvedValueOnce(groqResponse("ok"));

    await callLlm("prompt", "system");

    const { temperature } = mockCreate.mock.calls[0][0];
    expect(temperature).toBe(0.3);
  });

  test("retries once on a 429 rate-limit error then succeeds", async () => {
    const rateLimitError = Object.assign(new Error("rate limited"), {
      status: 429,
    });
    mockCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(groqResponse("retried ok"));

    const realSetTimeout = global.setTimeout;
    global.setTimeout = (fn) => {
      fn();
      return 0;
    };

    const result = await callLlm("prompt", "system");

    global.setTimeout = realSetTimeout;

    expect(result).toBe("retried ok");
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  test("throws after exhausting all 3 retries on persistent rate-limit", async () => {
    const rateLimitError = Object.assign(new Error("rate limited"), {
      status: 429,
    });
    mockCreate.mockRejectedValue(rateLimitError);

    const realSetTimeout = global.setTimeout;
    global.setTimeout = (fn) => {
      fn();
      return 0;
    };

    await expect(callLlm("prompt", "system")).rejects.toThrow("rate limited");

    global.setTimeout = realSetTimeout;
  });

  test("throws immediately on a non-rate-limit error (no retry)", async () => {
    const serverError = Object.assign(new Error("server exploded"), {
      status: 500,
    });
    mockCreate.mockRejectedValueOnce(serverError);

    await expect(callLlm("prompt", "system")).rejects.toThrow(
      "server exploded",
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

describe("parseJsonResponse — JSON parsing edge cases", () => {
  test("parses clean JSON", () => {
    expect(parseJsonResponse('{"score":72}')).toEqual({ score: 72 });
  });

  test("strips ```json fences", () => {
    expect(parseJsonResponse('```json\n{"score":72}\n```')).toEqual({
      score: 72,
    });
  });

  test("strips plain ``` fences", () => {
    expect(parseJsonResponse('```\n{"score":72}\n```')).toEqual({ score: 72 });
  });

  test("handles nested objects", () => {
    const r = parseJsonResponse('{"data":{"nested":true},"count":5}');
    expect(r.data.nested).toBe(true);
    expect(r.count).toBe(5);
  });

  test("handles arrays inside objects", () => {
    expect(parseJsonResponse('{"items":["a","b","c"]}')).toEqual({
      items: ["a", "b", "c"],
    });
  });

  test("throws on invalid JSON", () => {
    expect(() => parseJsonResponse("not json")).toThrow();
  });

  test("throws on empty string", () => {
    expect(() => parseJsonResponse("")).toThrow();
  });

  test("trims surrounding whitespace/newlines", () => {
    expect(parseJsonResponse('  \n  {"score":99}  \n  ')).toEqual({
      score: 99,
    });
  });
});

describe("runMixtureOfExperts — prompt shape & aggregation", () => {
  beforeEach(() => {
    mockCreate.mockReset();

    mockCreate
      .mockResolvedValueOnce(
        groqResponse(
          '{"trlNarrative":"Solid TRL-4 base.","trlRisk":"Hardware integration untested."}',
        ),
      )
      .mockResolvedValueOnce(
        groqResponse(
          '{"marketNarrative":"Large addressable market.","marketRisk":"Crowded space."}',
        ),
      )
      .mockResolvedValueOnce(
        groqResponse(
          '{"teamNarrative":"Balanced team.","teamRisk":"No sales lead."}',
        ),
      )
      .mockResolvedValueOnce(
        groqResponse(
          '{"tractionNarrative":"Early pilots live.","tractionRisk":"No paid customers yet."}',
        ),
      );
  });

  test("calls the LLM exactly 4 times (one per expert)", async () => {
    await runMixtureOfExperts(baseProject, 4, {
      market: 60,
      team: 70,
      traction: 50,
    });
    expect(mockCreate).toHaveBeenCalledTimes(4);
  });

  test("TRL expert prompt contains project title and rule-based TRL score", async () => {
    await runMixtureOfExperts(baseProject, 4, {});
    const trlPrompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(trlPrompt).toContain("AgroSense");
    expect(trlPrompt).toContain("4");
  });

  test("TRL expert system prompt is the trl specialist text", async () => {
    await runMixtureOfExperts(baseProject, 4, {});
    const systemMsg = mockCreate.mock.calls[0][0].messages[0].content;
    expect(systemMsg).toContain("Technology Readiness Levels");
  });

  test("Market expert prompt contains industry and IR market score", async () => {
    await runMixtureOfExperts(baseProject, 4, { market: 65 });
    const marketPrompt = mockCreate.mock.calls[1][0].messages[1].content;
    expect(marketPrompt).toContain("AgriTech");
    expect(marketPrompt).toContain("65");
  });

  test("Team expert prompt lists team member names and roles", async () => {
    await runMixtureOfExperts(baseProject, 4, { team: 70 });
    const teamPrompt = mockCreate.mock.calls[2][0].messages[1].content;
    expect(teamPrompt).toContain("Alice");
    expect(teamPrompt).toContain("CEO");
  });

  test("Traction expert prompt contains milestone counts", async () => {
    await runMixtureOfExperts(baseProject, 4, { traction: 50 });
    const tractionPrompt = mockCreate.mock.calls[3][0].messages[1].content;
    expect(tractionPrompt).toContain("2");
    expect(tractionPrompt).toContain("1");
  });

  test("aggregator builds executiveSummary from TRL + market narratives", async () => {
    const result = await runMixtureOfExperts(baseProject, 4, { market: 60 });
    expect(result.executiveSummary).toContain("Solid TRL-4 base.");
    expect(result.executiveSummary).toContain("Large addressable market.");
  });

  test("aggregator builds risksNarrative from all four risk fields", async () => {
    const result = await runMixtureOfExperts(baseProject, 4, {
      market: 60,
      team: 70,
      traction: 50,
    });
    expect(result.risksNarrative).toContain("Hardware integration untested.");
    expect(result.risksNarrative).toContain("Crowded space.");
    expect(result.risksNarrative).toContain("No sales lead.");
  });

  test("_expertsUsed flags are all true when every expert succeeds", async () => {
    const result = await runMixtureOfExperts(baseProject, 4, {});
    expect(result._expertsUsed).toEqual({
      trl: true,
      market: true,
      team: true,
      traction: true,
    });
  });

  test("gracefully handles a failing expert (null instead of crash)", async () => {
    mockCreate.mockReset();
    mockCreate
      .mockResolvedValueOnce(
        groqResponse('{"trlNarrative":"ok","trlRisk":"risk"}'),
      )
      .mockRejectedValueOnce(new Error("LLM timeout"))
      .mockResolvedValueOnce(
        groqResponse('{"teamNarrative":"ok","teamRisk":"risk"}'),
      )
      .mockResolvedValueOnce(
        groqResponse('{"tractionNarrative":"ok","tractionRisk":"risk"}'),
      );

    const result = await runMixtureOfExperts(baseProject, 4, {});
    expect(result._expertsUsed.market).toBe(false);
    expect(result._expertsUsed.trl).toBe(true);
  });
});

describe("createThesisAlignmentMoE — prompt shape & score blending", () => {
  beforeEach(() => {
    mockCreate.mockReset();

    mockCreate
      .mockResolvedValueOnce(
        groqResponse(
          '{"financialFit":"Stage matches well.","financialScore":80}',
        ),
      )
      .mockResolvedValueOnce(
        groqResponse(
          '{"alignmentSummary":"Strong thesis fit.","thesisMatches":["AgriTech focus"],"thesisMismatches":["Early stage"],"recommendedQuestions":["What is MRR?"],"strategicScore":70}',
        ),
      );
  });

  test("calls the LLM exactly 2 times (financial + strategic experts)", async () => {
    await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  test("financial expert prompt contains funding range and project stage", async () => {
    await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain("100000");
    expect(prompt).toContain("1000000");
    expect(prompt).toContain("Seed");
  });

  test("financial expert prompt includes the IR score", async () => {
    await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain("72");
  });

  test("strategic expert prompt contains investor thesis text", async () => {
    await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    const prompt = mockCreate.mock.calls[1][0].messages[1].content;
    expect(prompt).toContain("climate-tech");
  });

  test("strategic expert prompt contains project technologies", async () => {
    await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    const prompt = mockCreate.mock.calls[1][0].messages[1].content;
    expect(prompt).toContain("IoT");
  });

  test("alignmentScore is correctly blended (40% financial + 60% strategic)", async () => {
    const result = await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    expect(result.alignmentScore).toBe(74);
  });

  test("returns thesisMatches and thesisMismatches from strategic expert", async () => {
    const result = await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    expect(result.thesisMatches).toEqual(["AgriTech focus"]);
    expect(result.thesisMismatches).toEqual(["Early stage"]);
  });

  test("returns recommendedQuestions from strategic expert", async () => {
    const result = await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    expect(result.recommendedQuestions).toContain("What is MRR?");
  });

  test("returns empty arrays when strategic expert fails", async () => {
    mockCreate.mockReset();
    mockCreate
      .mockResolvedValueOnce(
        groqResponse('{"financialFit":"ok","financialScore":60}'),
      )
      .mockRejectedValueOnce(new Error("timeout"));

    const result = await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    expect(result.thesisMatches).toEqual([]);
    expect(result.recommendedQuestions).toEqual([]);
    expect(result.alignmentScore).toBe(24);
  });
});

describe("createPitchAnalysisMoE — prompt shape & output mapping", () => {
  beforeEach(() => {
    mockCreate.mockReset();

    mockCreate
      .mockResolvedValueOnce(
        groqResponse(
          '{"missingElements":["No financial projections provided.","Customer acquisition strategy is absent."],"overallClarity":75}',
        ),
      )
      .mockResolvedValueOnce(
        groqResponse(
          '{"pitchStrengths":["Strong technical team.","Clear market need.","Early traction shown."],"pitchWeaknesses":["Weak go-to-market plan.","No competitive analysis."],"investorAppeal":72}',
        ),
      );
  });

  test("calls the LLM exactly 2 times (clarity + appeal experts)", async () => {
    await createPitchAnalysisMoE(baseProject, baseAssessment);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  test("clarity expert prompt contains project title and tagline", async () => {
    await createPitchAnalysisMoE(baseProject, baseAssessment);
    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain("AgroSense");
    expect(prompt).toContain("AI-powered crop monitoring");
  });

  test("clarity expert prompt contains milestones", async () => {
    await createPitchAnalysisMoE(baseProject, baseAssessment);
    const prompt = mockCreate.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain("MVP");
  });

  test("appeal expert prompt contains TRL and IR scores", async () => {
    await createPitchAnalysisMoE(baseProject, baseAssessment);
    const prompt = mockCreate.mock.calls[1][0].messages[1].content;
    expect(prompt).toContain("4");
    expect(prompt).toContain("72");
  });

  test("appeal expert prompt contains funding amount and currency", async () => {
    await createPitchAnalysisMoE(baseProject, baseAssessment);
    const prompt = mockCreate.mock.calls[1][0].messages[1].content;
    expect(prompt).toContain("500000");
    expect(prompt).toContain("USD");
  });

  test("maps pitchStrengths from appeal expert correctly", async () => {
    const result = await createPitchAnalysisMoE(baseProject, baseAssessment);
    expect(result.pitchStrengths).toHaveLength(3);
    expect(result.pitchStrengths[0]).toBe("Strong technical team.");
  });

  test("maps pitchWeaknesses from appeal expert correctly", async () => {
    const result = await createPitchAnalysisMoE(baseProject, baseAssessment);
    expect(result.pitchWeaknesses).toHaveLength(2);
  });

  test("maps missingElements from clarity expert correctly", async () => {
    const result = await createPitchAnalysisMoE(baseProject, baseAssessment);
    expect(result.missingElements).toHaveLength(2);
    expect(result.missingElements[0]).toContain("financial projections");
  });

  test("maps overallClarity and investorAppeal scores", async () => {
    const result = await createPitchAnalysisMoE(baseProject, baseAssessment);
    expect(result.overallClarity).toBe(75);
    expect(result.investorAppeal).toBe(72);
  });

  test("returns empty arrays and zeros when both experts fail", async () => {
    mockCreate.mockReset();
    mockCreate
      .mockRejectedValueOnce(new Error("clarity timeout"))
      .mockRejectedValueOnce(new Error("appeal timeout"));

    const result = await createPitchAnalysisMoE(baseProject, baseAssessment);
    expect(result.pitchStrengths).toEqual([]);
    expect(result.pitchWeaknesses).toEqual([]);
    expect(result.missingElements).toEqual([]);
    expect(result.overallClarity).toBe(0);
    expect(result.investorAppeal).toBe(0);
  });
});

describe("Call-count discipline — no extra or missing LLM calls", () => {
  beforeEach(() => mockCreate.mockReset());

  test("runMixtureOfExperts always calls LLM exactly 4 times per run", async () => {
    mockCreate.mockResolvedValue(
      groqResponse(
        '{"trlNarrative":"x","trlRisk":"y","marketNarrative":"x","marketRisk":"y","teamNarrative":"x","teamRisk":"y","tractionNarrative":"x","tractionRisk":"y"}',
      ),
    );
    await runMixtureOfExperts(baseProject, 4, {});
    expect(mockCreate).toHaveBeenCalledTimes(4);
  });

  test("createThesisAlignmentMoE always calls LLM exactly 2 times per run", async () => {
    mockCreate
      .mockResolvedValueOnce(
        groqResponse('{"financialFit":"ok","financialScore":50}'),
      )
      .mockResolvedValueOnce(
        groqResponse(
          '{"alignmentSummary":"ok","thesisMatches":[],"thesisMismatches":[],"recommendedQuestions":[],"strategicScore":50}',
        ),
      );
    await createThesisAlignmentMoE(
      baseInvestorProfile,
      baseProject,
      baseAssessment,
    );
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  test("createPitchAnalysisMoE always calls LLM exactly 2 times per run", async () => {
    mockCreate
      .mockResolvedValueOnce(
        groqResponse('{"missingElements":[],"overallClarity":50}'),
      )
      .mockResolvedValueOnce(
        groqResponse(
          '{"pitchStrengths":[],"pitchWeaknesses":[],"investorAppeal":50}',
        ),
      );
    await createPitchAnalysisMoE(baseProject, baseAssessment);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  test("two sequential runMixtureOfExperts calls make 8 total LLM calls (4 each)", async () => {
    mockCreate.mockResolvedValue(
      groqResponse('{"trlNarrative":"x","trlRisk":"y"}'),
    );
    await runMixtureOfExperts(baseProject, 4, {});
    await runMixtureOfExperts(baseProject, 4, {});
    expect(mockCreate).toHaveBeenCalledTimes(8);
  });
});
