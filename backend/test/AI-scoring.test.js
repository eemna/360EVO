import {
  calculateTRLScore,
  calculateTRLConfidence,
  financialScore,
  marketScore,
  teamScore,
  tractionScore,
  competitiveScore,
  irCompositeScore,
  runRuleBasedScoring,
} from "../services/aiScoring.js";

import {
  triangular,
  trapezoidal,
  sigmoid,
  textSimilarity,
  fuzzifyIndustry,
  fuzzifyStage,
  fuzzifyFunding,
  fuzzifyTechnology,
  fuzzifyThesis,
  fuzzifyGeography,
  defuzzifyCategory,
} from "../services/fuzzylogic.js";

import { calculateMatchScore } from "../services/matchingEngine.js";

const minimalProject = {
  title: "Test Project",
  tagline: "Short tagline",
  shortDesc:
    "A short description that is well over eighty characters long for testing purposes here.",
  fullDesc:
    "A full description that is more than three hundred characters long for this test project scenario. " +
    "We are building a FinTech platform that enables financial inclusion across emerging markets using " +
    "modern web technologies. Our solution addresses the lack of affordable banking services for the " +
    "unbanked population in North Africa and Sub-Saharan Africa.",
  stage: "MVP",
  industry: "FinTech",
  technologies: ["React", "Node.js", "PostgreSQL"],
  fundingSought: 500000,
  currency: "USD",
  location: "Tunis, Tunisia",
  teamMembers: [
    { name: "Alice", role: "CEO", photo: null },
    { name: "Bob", role: "CTO", photo: "http://example.com/bob.jpg" },
  ],
  milestones: [
    {
      title: "MVP",
      description: "Built MVP",
      completedAt: new Date(),
      order: 1,
    },
    { title: "Beta", description: "Beta launch", completedAt: null, order: 2 },
  ],
  documents: [
    {
      name: "pitch.pdf",
      fileUrl: "http://example.com/pitch.pdf",
      fileKey: "pitch",
      fileType: "application/pdf",
    },
  ],
  updates: [{ content: "Update 1" }, { content: "Update 2" }],
};

const investorProfile = {
  industries: ["FinTech", "SaaS"],
  stages: ["MVP", "GROWTH"],
  technologies: ["React", "Node.js"],
  fundingMin: 200000,
  fundingMax: 1000000,
  currency: "USD",
  geographicPrefs: ["Tunisia", "North Africa"],
  riskTolerance: "MEDIUM",
  dealStructures: [],
  mustHaves: {},
  exclusions: {},
  investmentThesis:
    "We invest in FinTech startups using modern web technologies to solve financial inclusion problems in emerging markets.",
};

// TRL SCORE

describe("calculateTRLScore", () => {
  test("IDEA stage with minimal info → score 1", () => {
    const { score } = calculateTRLScore({ stage: "IDEA", shortDesc: "Hi" });
    expect(score).toBe(1);
  });

  test("IDEA stage with long desc → score 2", () => {
    const { score } = calculateTRLScore({
      stage: "IDEA",
      shortDesc: "A".repeat(60),
    });
    expect(score).toBe(2);
  });

  test("IDEA stage with team + milestones + long fullDesc → score 3", () => {
    const { score } = calculateTRLScore({
      stage: "IDEA",
      teamMembers: [{ name: "Alice", role: "CEO" }],
      milestones: [{ title: "M1", completedAt: null }],
      fullDesc: "A".repeat(210),
    });
    expect(score).toBe(3);
  });

  test("PROTOTYPE with docs and completed milestone → score 5", () => {
    const { score } = calculateTRLScore({
      stage: "PROTOTYPE",
      documents: [{ name: "doc.pdf" }],
      milestones: [{ completedAt: new Date() }],
      ipStatus: "GRANTED",
    });
    expect(score).toBe(5);
  });

  test("PROTOTYPE without docs → score 4", () => {
    const { score } = calculateTRLScore({ stage: "PROTOTYPE" });
    expect(score).toBe(4);
  });

  test("MVP with updates + completed milestone + team + pilots → score 7", () => {
    const { score } = calculateTRLScore({
      stage: "MVP",
      updates: [{}],
      milestones: [{ completedAt: new Date() }],
      teamMembers: [{ name: "Alice" }],
      pilotUsers: 5,
    });
    expect(score).toBe(7);
  });

  test("MVP without all conditions → score 6", () => {
    const { score } = calculateTRLScore({ stage: "MVP" });
    expect(score).toBe(6);
  });

  test("GROWTH → score 8", () => {
    const { score } = calculateTRLScore({ stage: "GROWTH" });
    expect(score).toBe(8);
  });

  test("SCALING → score 9", () => {
    const { score } = calculateTRLScore({ stage: "SCALING" });
    expect(score).toBe(9);
  });

  test("unknown stage → score 1", () => {
    const { score } = calculateTRLScore({ stage: "UNKNOWN" });
    expect(score).toBe(1);
  });

  test("breakdown contains expected keys", () => {
    const { breakdown } = calculateTRLScore(minimalProject);
    expect(breakdown).toHaveProperty("stage");
    expect(breakdown).toHaveProperty("hasTeam");
    expect(breakdown).toHaveProperty("hasMilestones");
    expect(breakdown).toHaveProperty("hasCompletedMilestone");
    expect(breakdown).toHaveProperty("hasDocuments");
    expect(breakdown).toHaveProperty("hasUpdates");
  });
});

// TRL CONFIDENCE

describe("calculateTRLConfidence", () => {
  test("fully populated project → HIGH", () => {
    const confidence = calculateTRLConfidence(minimalProject);
    expect(confidence).toBe("HIGH");
  });

  test("empty project → LOW", () => {
    const confidence = calculateTRLConfidence({});
    expect(confidence).toBe("LOW");
  });

  test("partially filled → MEDIUM", () => {
    const confidence = calculateTRLConfidence({
      title: "Test",
      tagline: "Tag",
      shortDesc: "Short",
      stage: "MVP",
      industry: "FinTech",
    });
    expect(confidence).toBe("MEDIUM");
  });
});

// IR SUB-SCORES

describe("financialScore", () => {
  test("no funding or docs → 0", () => {
    expect(financialScore({})).toBe(0);
  });

  test("funding + currency + PDF doc → 100", () => {
    expect(
      financialScore({
        fundingSought: 500000,
        currency: "USD",
        documents: [{ name: "pitch.pdf", fileType: "application/pdf" }],
      }),
    ).toBe(100);
  });

  test("funding only → 40", () => {
    expect(financialScore({ fundingSought: 100000 })).toBe(40);
  });

  test("funding + currency → 60", () => {
    expect(financialScore({ fundingSought: 100000, currency: "USD" })).toBe(60);
  });

  test("score never exceeds 100", () => {
    expect(financialScore(minimalProject)).toBeLessThanOrEqual(100);
  });
});

describe("marketScore", () => {
  test("empty project → 0", () => {
    expect(marketScore({})).toBe(0);
  });

  test("industry only → 20", () => {
    expect(marketScore({ industry: "FinTech" })).toBe(20);
  });

  test("full project (industry + shortDesc>80 + fullDesc>300 + techs>=2) → score ≥ 70", () => {
    expect(marketScore(minimalProject)).toBeGreaterThanOrEqual(70);
  });

  test("score never exceeds 100", () => {
    expect(marketScore(minimalProject)).toBeLessThanOrEqual(100);
  });
});

describe("teamScore", () => {
  test("no team → 20 (every() on empty array is vacuously true, adds role bonus)", () => {
    expect(teamScore({})).toBe(20);
  });

  test("1 member with role → 50", () => {
    expect(teamScore({ teamMembers: [{ role: "CEO" }] })).toBe(50);
  });

  test("3+ members with roles and photo → high score", () => {
    const score = teamScore({
      teamMembers: [
        { role: "CEO", photo: "url" },
        { role: "CTO", photo: null },
        { role: "CFO", photo: null },
      ],
    });
    expect(score).toBeGreaterThanOrEqual(80);
  });

  test("score never exceeds 100", () => {
    expect(teamScore(minimalProject)).toBeLessThanOrEqual(100);
  });
});

describe("tractionScore", () => {
  test("no milestones or updates → 0", () => {
    expect(tractionScore({})).toBe(0);
  });

  test("1 milestone planned → 20", () => {
    expect(
      tractionScore({
        milestones: [{ completedAt: null }],
      }),
    ).toBe(20);
  });

  test("completed milestone + updates → higher score", () => {
    const score = tractionScore({
      milestones: [
        { completedAt: new Date() },
        { completedAt: new Date() },
        { completedAt: new Date() },
      ],
      updates: [{ content: "u1" }, { content: "u2" }, { content: "u3" }],
    });
    expect(score).toBe(100);
  });

  test("score never exceeds 100", () => {
    expect(tractionScore(minimalProject)).toBeLessThanOrEqual(100);
  });
});

describe("competitiveScore", () => {
  test("empty project → 0", () => {
    expect(competitiveScore({})).toBe(0);
  });

  test("1 technology → 30", () => {
    expect(competitiveScore({ technologies: ["React"] })).toBe(30);
  });

  test("3+ techs + long tagline + mature stage → 100", () => {
    expect(
      competitiveScore({
        technologies: ["React", "Node.js", "AI"],
        tagline: "A tagline that is definitely longer than twenty characters",
        stage: "MVP",
      }),
    ).toBe(100);
  });
});

// IR COMPOSITE

describe("irCompositeScore", () => {
  test("returns composite, breakdown, and recommendations", () => {
    const result = irCompositeScore(minimalProject);
    expect(result).toHaveProperty("composite");
    expect(result).toHaveProperty("breakdown");
    expect(result).toHaveProperty("recommendations");
  });

  test("composite is between 0 and 100", () => {
    const { composite } = irCompositeScore(minimalProject);
    expect(composite).toBeGreaterThanOrEqual(0);
    expect(composite).toBeLessThanOrEqual(100);
  });

  test("returns exactly 3 recommendations", () => {
    const { recommendations } = irCompositeScore(minimalProject);
    expect(recommendations).toHaveLength(3);
  });

  test("recommendations are strings", () => {
    const { recommendations } = irCompositeScore(minimalProject);
    recommendations.forEach((r) => expect(typeof r).toBe("string"));
  });

  test("empty project → composite equals teamScore({}) * 0.2 = 4", () => {
    const { composite } = irCompositeScore({});
    expect(composite).toBe(4);
  });

  test("breakdown contains all 5 dimensions", () => {
    const { breakdown } = irCompositeScore(minimalProject);
    ["financial", "market", "team", "traction", "competitive"].forEach((k) =>
      expect(breakdown).toHaveProperty(k),
    );
  });
});

// runRuleBasedScoring (integration of TRL + IR)

describe("runRuleBasedScoring", () => {
  test("returns all expected keys", () => {
    const result = runRuleBasedScoring(minimalProject);
    expect(result).toHaveProperty("trlScore");
    expect(result).toHaveProperty("trlBreakdown");
    expect(result).toHaveProperty("trlConfidence");
    expect(result).toHaveProperty("irScore");
    expect(result).toHaveProperty("irBreakdown");
    expect(result).toHaveProperty("recommendations");
  });

  test("trlScore is 1–9", () => {
    const { trlScore } = runRuleBasedScoring(minimalProject);
    expect(trlScore).toBeGreaterThanOrEqual(1);
    expect(trlScore).toBeLessThanOrEqual(9);
  });

  test("irScore is 0–100", () => {
    const { irScore } = runRuleBasedScoring(minimalProject);
    expect(irScore).toBeGreaterThanOrEqual(0);
    expect(irScore).toBeLessThanOrEqual(100);
  });
});

// FUZZY MATH
describe("fuzzy math primitives", () => {
  describe("triangular", () => {
    test("returns 0 outside bounds", () => {
      expect(triangular(0, 1, 2, 3)).toBe(0);
      expect(triangular(4, 1, 2, 3)).toBe(0);
    });
    test("returns 1 at peak", () => {
      expect(triangular(2, 1, 2, 3)).toBe(1);
    });
    test("returns 0.5 midway on rising slope", () => {
      expect(triangular(1.5, 1, 2, 3)).toBeCloseTo(0.5);
    });
  });

  describe("trapezoidal", () => {
    test("returns 0 outside outer bounds", () => {
      expect(trapezoidal(0, 1, 2, 3, 4)).toBe(0);
      expect(trapezoidal(5, 1, 2, 3, 4)).toBe(0);
    });
    test("returns 1 in flat top region", () => {
      expect(trapezoidal(2.5, 1, 2, 3, 4)).toBe(1);
    });
  });

  describe("sigmoid", () => {
    test("returns ~0.5 at inflection point", () => {
      expect(sigmoid(0.5, 0.5)).toBeCloseTo(0.5, 1);
    });
    test("returns > 0.9 well above inflection", () => {
      expect(sigmoid(1.0, 0.5)).toBeGreaterThan(0.9);
    });
    test("returns < 0.1 well below inflection", () => {
      expect(sigmoid(0.0, 0.5)).toBeLessThan(0.1);
    });
  });
});

// FUZZIFICATION

describe("fuzzifyIndustry", () => {
  test("exact match → high = 1", () => {
    const result = fuzzifyIndustry(["FinTech"], "FinTech");
    expect(result.high).toBe(1.0);
  });

  test("no investor industries → medium 0.6", () => {
    const result = fuzzifyIndustry([], "FinTech");
    expect(result.medium).toBe(0.6);
  });

  test("completely different industry → low = 1", () => {
    const result = fuzzifyIndustry(["AgriTech"], "Cybersecurity");
    expect(result.low).toBe(1.0);
  });
});

describe("fuzzifyStage", () => {
  test("exact stage match → high = 1", () => {
    const result = fuzzifyStage(["MVP"], "MVP");
    expect(result.high).toBe(1);
  });

  test("adjacent stage → medium > 0", () => {
    const result = fuzzifyStage(["MVP"], "GROWTH");
    expect(result.medium).toBeGreaterThan(0);
  });

  test("far stage → low > 0", () => {
    const result = fuzzifyStage(["IDEA"], "SCALING");
    expect(result.low).toBeGreaterThan(0);
  });

  test("no stages → medium 0.5", () => {
    const result = fuzzifyStage([], "MVP");
    expect(result.medium).toBe(0.5);
  });
});

describe("fuzzifyFunding", () => {
  test("in range → high > 0.8", () => {
    const result = fuzzifyFunding(
      { fundingMin: 100000, fundingMax: 1000000 },
      { fundingSought: 500000 },
    );
    expect(result.high).toBeGreaterThan(0.8);
  });

  test("far outside range → low > 0", () => {
    const result = fuzzifyFunding(
      { fundingMin: 900000, fundingMax: 1000000 },
      { fundingSought: 10000 },
    );
    expect(result.low).toBe(1.0);
  });

  test("no min/max → medium 0.5", () => {
    const result = fuzzifyFunding({}, { fundingSought: 500000 });
    expect(result.medium).toBe(0.5);
  });
});

describe("fuzzifyTechnology", () => {
  test("exact tech match → high > 0.5", () => {
    const result = fuzzifyTechnology(["React"], ["React"], "React app");
    expect(result.high).toBeGreaterThan(0.5);
  });

  test("no investor techs → medium 0.5", () => {
    const result = fuzzifyTechnology([], ["React"], "");
    expect(result.medium).toBe(0.5);
  });

  test("returns _overlapRatio and _nlpSim", () => {
    const result = fuzzifyTechnology(["React"], ["React"], "");
    expect(result).toHaveProperty("_overlapRatio");
    expect(result).toHaveProperty("_nlpSim");
  });
});

describe("fuzzifyThesis", () => {
  test("matching thesis → high > 0", () => {
    const result = fuzzifyThesis(
      "FinTech startups using web technology for financial inclusion",
      "We build FinTech solutions for financial inclusion using web technology",
    );
    expect(result.high).toBeGreaterThan(0);
  });

  test("empty thesis → medium 0.5", () => {
    const result = fuzzifyThesis("", "some project");
    expect(result.medium).toBe(0.5);
  });

  test("returns _rawSimilarity > 0 for matching multi-word text", () => {
    const result = fuzzifyThesis(
      "fintech blockchain investment capital",
      "fintech blockchain investment capital",
    );
    expect(result).toHaveProperty("_rawSimilarity");
    expect(result._rawSimilarity).toBeGreaterThan(0);
  });
});

describe("fuzzifyGeography", () => {
  test("exact location string match → high = 1", () => {
    const result = fuzzifyGeography(
      { geographicPrefs: ["Tunisia"] },
      { location: "Tunisia" },
    );
    expect(result.high).toBe(1.0);
  });

  test("global preference → high = 1", () => {
    const result = fuzzifyGeography(
      { geographicPrefs: ["Global"] },
      { location: "Anywhere" },
    );
    expect(result.high).toBe(1.0);
  });

  test("no prefs → medium 0.5", () => {
    const result = fuzzifyGeography(
      { geographicPrefs: [] },
      { location: "Tunisia" },
    );
    expect(result.medium).toBe(0.5);
  });
});

// DEFUZZIFICATION

describe("defuzzifyCategory", () => {
  test("all-high membership → near maxPts * 0.95", () => {
    const result = defuzzifyCategory({ low: 0, medium: 0, high: 1 }, 100);
    expect(result).toBeCloseTo(95, 0);
  });

  test("all-low membership → near maxPts * 0.15", () => {
    const result = defuzzifyCategory({ low: 1, medium: 0, high: 0 }, 100);
    expect(result).toBeCloseTo(15, 0);
  });

  test("all-zero → neutral fallback (medium centroid)", () => {
    const result = defuzzifyCategory({ low: 0, medium: 0, high: 0 }, 100);
    expect(result).toBeCloseTo(50, 0);
  });

  test("result is within [0, maxPts]", () => {
    const result = defuzzifyCategory({ low: 0.3, medium: 0.5, high: 0.8 }, 25);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(25);
  });
});

// textSimilarity

describe("textSimilarity", () => {
  test("identical texts → 1", () => {
    expect(
      textSimilarity("fintech investment africa", "fintech investment africa"),
    ).toBeCloseTo(1);
  });

  test("completely different → 0", () => {
    expect(
      textSimilarity("agriculture farming crops", "blockchain crypto nft"),
    ).toBe(0);
  });

  test("partial overlap → between 0 and 1", () => {
    const sim = textSimilarity("fintech mobile payments", "fintech blockchain");
    expect(sim).toBeGreaterThan(0);
    expect(sim).toBeLessThan(1);
  });

  test("abbreviation expansion: AI matches artificial intelligence", () => {
    const sim = textSimilarity(
      "ai machine learning",
      "artificial intelligence machine learning",
    );
    expect(sim).toBeGreaterThan(0.5);
  });
});

describe("calculateMatchScore", () => {
  const assessment = { trlScore: 7, irScore: 72 };

  test("returns matchScore, categoryScores, reasoning", () => {
    const result = calculateMatchScore(
      investorProfile,
      minimalProject,
      assessment,
    );
    expect(result).toHaveProperty("matchScore");
    expect(result).toHaveProperty("categoryScores");
    expect(result).toHaveProperty("reasoning");
  });

  test("matchScore is 0–100", () => {
    const { matchScore } = calculateMatchScore(
      investorProfile,
      minimalProject,
      assessment,
    );
    expect(matchScore).toBeGreaterThanOrEqual(0);
    expect(matchScore).toBeLessThanOrEqual(100);
  });

  test("categoryScores contains all expected keys", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      minimalProject,
      assessment,
    );
    [
      "industry",
      "stage",
      "technology",
      "funding",
      "geography",
      "irBonus",
    ].forEach((k) => expect(categoryScores).toHaveProperty(k));
  });

  test("well-matching investor + project → score > 50", () => {
    const { matchScore } = calculateMatchScore(
      investorProfile,
      minimalProject,
      assessment,
    );
    expect(matchScore).toBeGreaterThan(50);
  });

  test("exclusion on industry → score heavily penalised", () => {
    const exclusiveProfile = {
      ...investorProfile,
      exclusions: { industries: ["FinTech"] },
    };
    const { matchScore: excluded } = calculateMatchScore(
      exclusiveProfile,
      minimalProject,
      assessment,
    );
    const { matchScore: normal } = calculateMatchScore(
      investorProfile,
      minimalProject,
      assessment,
    );
    expect(excluded).toBeLessThan(normal - 40);
  });

  test("mustHave minTRL not met → score penalised", () => {
    const strictProfile = { ...investorProfile, mustHaves: { minTRL: 9 } };
    const lowTrlAssessment = { trlScore: 3, irScore: 50 };
    const { matchScore: penalised } = calculateMatchScore(
      strictProfile,
      minimalProject,
      lowTrlAssessment,
    );
    const { matchScore: normal } = calculateMatchScore(
      investorProfile,
      minimalProject,
      lowTrlAssessment,
    );
    expect(penalised).toBeLessThan(normal);
  });

  test("empty investor profile → does not throw", () => {
    const emptyProfile = {
      industries: [],
      stages: [],
      technologies: [],
      fundingMin: null,
      fundingMax: null,
      geographicPrefs: [],
      mustHaves: {},
      exclusions: {},
      investmentThesis: "",
    };
    expect(() =>
      calculateMatchScore(emptyProfile, minimalProject, null),
    ).not.toThrow();
  });

  test("null assessment → does not throw, irBonus = 0", () => {
    const { categoryScores } = calculateMatchScore(
      investorProfile,
      minimalProject,
      null,
    );
    expect(categoryScores.irBonus).toBe(0);
  });

  test("reasoning.irScore is formatted as string", () => {
    const { reasoning } = calculateMatchScore(
      investorProfile,
      minimalProject,
      assessment,
    );
    expect(reasoning.irScore).toBe("72/100");
  });
});
