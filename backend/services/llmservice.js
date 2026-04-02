import Groq from "groq-sdk";

export async function callLlm(prompt, systemPrompt, maxTokens = 1000) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy-key-for-tests",
  });
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const start = Date.now();
    try {
      const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        max_tokens: maxTokens,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      });

      const latency = Date.now() - start;
      console.log(`[LLM] Success in ${latency}ms (attempt ${attempt + 1})`);

      return response.choices[0].message.content.trim();
    } catch (error) {
      const isRateLimit = error?.status === 429 || error?.status === 529;

      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.warn(`[LLM] Rate limited, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      } else {
        console.error(
          `[LLM] Failed after ${attempt + 1} attempts:`,
          error.message,
        );
        throw error;
      }
    }
  }
}

export function parseJsonResponse(raw) {
  const cleaned = raw
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/\s*```$/m, "")
    .trim();

  return JSON.parse(cleaned);
}

// MIXTURE OF EXPERTS

const EXPERTS = {
  trl: "You are a deep tech engineer specialized in Technology Readiness Levels 1-9. Only assess technical maturity. Respond ONLY in JSON, no markdown.",
  market:
    "You are a market sizing analyst. Only assess market opportunity and industry fit. Respond ONLY in JSON, no markdown.",
  team: "You are a VC talent partner. Only evaluate founding team quality and composition. Respond ONLY in JSON, no markdown.",
  traction:
    "You are a growth analyst. Only evaluate traction signals and momentum evidence. Respond ONLY in JSON, no markdown.",
  financial:
    "You are a financial analyst at a VC fund. Only evaluate financial fit and stage alignment. Respond ONLY in JSON, no markdown.",
  strategic:
    "You are a strategic investment partner. Only evaluate thesis alignment and strategic fit. Respond ONLY in JSON, no markdown.",
  clarity:
    "You are a pitch deck coach. Only evaluate pitch clarity and completeness. Respond ONLY in JSON, no markdown.",
  appeal:
    "You are an investment committee member. Only evaluate investor appeal and return potential. Respond ONLY in JSON, no markdown.",
};

// ── MoE 1: Project Assessment (4 experts)
export async function runMixtureOfExperts(project, trlScore, irBreakdown) {
  console.log("[MoE] Running 4 experts in parallel for project:", project.id);

  const [trlResult, marketResult, teamResult, tractionResult] =
    await Promise.all([
      // Expert 1 — TRL
      callLlm(
        `Project: ${project.title} | Stage: ${project.stage}
Technologies: ${project.technologies?.join(", ") || "none"}
Description: ${project.shortDesc}
Rule-based TRL score: ${trlScore}/9
Respond ONLY with: {"trlNarrative":"<2 sentences on technical maturity>","trlRisk":"<1 sentence on biggest technical risk>"}`,
        EXPERTS.trl,
        300,
      )
        .then((raw) => parseJsonResponse(raw))
        .catch(() => null),

      // Expert 2 — Market
      callLlm(
        `Project: ${project.title} | Industry: ${project.industry}
Description: ${project.fullDesc?.slice(0, 400)}
Market IR score: ${irBreakdown?.market || 0}/100
Respond ONLY with: {"marketNarrative":"<2 sentences on market opportunity>","marketRisk":"<1 sentence on market risk>"}`,
        EXPERTS.market,
        300,
      )
        .then((raw) => parseJsonResponse(raw))
        .catch(() => null),

      // Expert 3 — Team
      callLlm(
        `Project: ${project.title}
Team size: ${project.teamMembers?.length || 0}
Members: ${project.teamMembers?.map((m) => `${m.name} (${m.role})`).join(", ") || "none"}
Team IR score: ${irBreakdown?.team || 0}/100
Respond ONLY with: {"teamNarrative":"<2 sentences on team quality>","teamRisk":"<1 sentence on team gap>"}`,
        EXPERTS.team,
        300,
      )
        .then((raw) => parseJsonResponse(raw))
        .catch(() => null),

      // Expert 4 — Traction
      callLlm(
        `Project: ${project.title}
Milestones planned: ${project.milestones?.length || 0}
Milestones completed: ${project.milestones?.filter((m) => m.completedAt)?.length || 0}
Updates posted: ${project.updates?.length || 0}
Traction IR score: ${irBreakdown?.traction || 0}/100
Respond ONLY with: {"tractionNarrative":"<2 sentences on traction>","tractionRisk":"<1 sentence on traction gap>"}`,
        EXPERTS.traction,
        300,
      )
        .then((raw) => parseJsonResponse(raw))
        .catch(() => null),
    ]);

  console.log("[MoE] Experts completed:", {
    trl: !!trlResult,
    market: !!marketResult,
    team: !!teamResult,
    traction: !!tractionResult,
  });

  // Aggregator
  return {
    executiveSummary: [trlResult?.trlNarrative, marketResult?.marketNarrative]
      .filter(Boolean)
      .join(" "),
    strengthsNarrative: [trlResult?.trlNarrative, teamResult?.teamNarrative]
      .filter(Boolean)
      .join(" "),
    risksNarrative: [
      trlResult?.trlRisk,
      marketResult?.marketRisk,
      teamResult?.teamRisk,
      tractionResult?.tractionRisk,
    ]
      .filter(Boolean)
      .join(" "),
    marketOpportunityNarrative: marketResult?.marketNarrative || "",
    _expertsUsed: {
      trl: !!trlResult,
      market: !!marketResult,
      team: !!teamResult,
      traction: !!tractionResult,
    },
  };
}

// ── MoE 2: Thesis Alignment (2 experts)
export async function createThesisAlignmentMoE(
  investorProfile,
  project,
  assessment,
) {
  console.log(
    "[MoE] Running thesis alignment experts for project:",
    project.id,
  );

  const [financialExpert, strategicExpert] = await Promise.all([
    // Expert 1 — Financial fit
    callLlm(
      `Investor funding range: ${investorProfile.fundingMin} - ${investorProfile.fundingMax} ${investorProfile.currency || ""}
Investor stages: ${investorProfile.stages?.join(", ") || "any"}
Project funding sought: ${project.fundingSought} ${project.currency}
Project stage: ${project.stage}
IR Score: ${assessment?.irScore || 0}/100
Respond ONLY with: {"financialFit":"<2 sentences>","financialScore":<0-100>}`,
      EXPERTS.financial,
      200,
    )
      .then((raw) => parseJsonResponse(raw))
      .catch(() => null),

    // Expert 2 — Strategic fit
    callLlm(
      `Investor thesis: ${investorProfile.investmentThesis || "not specified"}
Must-haves: ${JSON.stringify(investorProfile.mustHaves || {})}
Exclusions: ${JSON.stringify(investorProfile.exclusions || {})}
Project industry: ${project.industry}
Technologies: ${project.technologies?.join(", ") || "none"}
Description: ${project.fullDesc?.slice(0, 400)}
Respond ONLY with: {"alignmentSummary":"<2 sentences>","thesisMatches":["<match1>","<match2>"],"thesisMismatches":["<gap1>","<gap2>"],"recommendedQuestions":["<q1>","<q2>","<q3>"],"strategicScore":<0-100>}`,
      EXPERTS.strategic,
      400,
    )
      .then((raw) => parseJsonResponse(raw))
      .catch(() => null),
  ]);

  const alignmentScore = Math.round(
    (financialExpert?.financialScore || 0) * 0.4 +
      (strategicExpert?.strategicScore || 0) * 0.6,
  );

  return {
    alignmentScore,
    alignmentSummary: [
      financialExpert?.financialFit,
      strategicExpert?.alignmentSummary,
    ]
      .filter(Boolean)
      .join(" "),
    thesisMatches: strategicExpert?.thesisMatches || [],
    thesisMismatches: strategicExpert?.thesisMismatches || [],
    recommendedQuestions: strategicExpert?.recommendedQuestions || [],
  };
}

// ── MoE 3: Pitch Analysis (2 experts)
export async function createPitchAnalysisMoE(project, assessment) {
  console.log("[MoE] Running pitch analysis experts for project:", project.id);

  const [clarityExpert, appealExpert] = await Promise.all([
    // Expert 1 — Clarity
    callLlm(
      `Title: ${project.title}
Tagline: ${project.tagline}
Short description: ${project.shortDesc}
Full description: ${project.fullDesc?.slice(0, 500)}
Milestones: ${project.milestones?.map((m) => m.title).join(", ") || "none"}
Respond ONLY with valid JSON in exactly this format:
{"missingElements":["first missing element as a full sentence","second missing element as a full sentence"],"overallClarity":75}
Use real sentences, not placeholders.`,
      EXPERTS.clarity,
      300,
    )
      .then((raw) => parseJsonResponse(raw))
      .catch(() => null),

    // Expert 2 — Appeal
    callLlm(
      `Project: ${project.title} | Industry: ${project.industry} | Stage: ${project.stage}
Team size: ${project.teamMembers?.length || 0}
TRL: ${assessment?.trlScore || 0}/9 | IR: ${assessment?.irScore || 0}/100
Funding: ${project.fundingSought} ${project.currency}
Technologies: ${project.technologies?.join(", ") || "none"}
Respond ONLY with valid JSON in exactly this format:
{"pitchStrengths":["first strength as a full sentence","second strength as a full sentence","third strength as a full sentence"],"pitchWeaknesses":["first weakness as a full sentence","second weakness as a full sentence"],"investorAppeal":72}
Use real sentences, not placeholders.`,
      EXPERTS.appeal,
      300,
    )
      .then((raw) => parseJsonResponse(raw))
      .catch(() => null),
  ]);

  return {
    pitchStrengths: appealExpert?.pitchStrengths || [],
    pitchWeaknesses: appealExpert?.pitchWeaknesses || [],
    missingElements: clarityExpert?.missingElements || [],
    overallClarity: clarityExpert?.overallClarity || 0,
    investorAppeal: appealExpert?.investorAppeal || 0,
  };
}
