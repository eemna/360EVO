import Groq from "groq-sdk";
import {
  llmCallsTotal,
  llmCallDuration,
  llmRetries,
} from "../middleware/metrics.js";

export async function callLlm(prompt, systemPrompt, maxTokens = 1000) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy-key-for-tests",
  });
  const MAX_RETRIES = 3;
  let attempt = 0;
  const end = llmCallDuration.startTimer({ service: "callLlm" });
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
      end();
      llmCallsTotal.inc({ service: "callLlm", success: "true" });
      return response.choices[0].message.content.trim();
    } catch (error) {
      const isRateLimit = error?.status === 429 || error?.status === 529;
      if (isRateLimit && attempt < MAX_RETRIES - 1) {
        llmRetries.inc({ attempt: String(attempt + 1) });
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      } else {
        end();
        llmCallsTotal.inc({ service: "callLlm", success: "false" });
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
  const end = llmCallDuration.startTimer({ service: "runMixtureOfExperts" });
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
  end();
  llmCallsTotal.inc({ service: "runMixtureOfExperts", success: "true" });
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
  console.log("[MoE] Running thesis alignment experts for project:", project.id);
  const end = llmCallDuration.startTimer({ service: "createThesisAlignmentMoE" });

  const [financialExpert, strategicExpert] = await Promise.all([

    // Expert 1 — Financial fit

callLlm(
  `You are evaluating financial and stage fit between an investor and a project.

INVESTOR:
- Funding range: ${investorProfile.fundingMin ?? "unspecified"} - ${investorProfile.fundingMax ?? "unspecified"} ${investorProfile.currency || ""}
- Preferred stages: ${investorProfile.stages?.join(", ") || "any"}
- Risk tolerance: ${investorProfile.riskTolerance || "MEDIUM"}
- Deal structures: ${investorProfile.dealStructures?.join(", ") || "any"}

PROJECT:
- Funding sought: ${project.fundingSought} ${project.currency}
- Stage: ${project.stage}
- Industry: ${project.industry}
- IR Score: ${assessment?.irScore || 0}/100
- TRL Score: ${assessment?.trlScore || 0}/9

Respond ONLY with valid JSON, no markdown:
{"financialFit":"<2 sentences on financial and stage fit>","financialScore":<0-100>}`,
  EXPERTS.financial,
  250,
)
      .then((raw) => parseJsonResponse(raw))
      .catch((err) => {
        console.error("[MoE] Financial expert failed:", err.message);
        return null;
      }),

    // Expert 2 — Strategic fit
    callLlm(
      `You are evaluating strategic and thesis alignment between an investor and a project.

INVESTOR:
- Investment thesis: ${investorProfile.investmentThesis || "not specified"}
- Must-haves: ${JSON.stringify(investorProfile.mustHaves || {})}
- Target industries: ${investorProfile.industries?.join(", ") || "any"}
- Target technologies: ${investorProfile.technologies?.join(", ") || "any"}
- Exclusions (investor will NOT invest if these apply): ${JSON.stringify(investorProfile.exclusions || {})}


PROJECT:
- Title: ${project.title}
- Industry: ${project.industry}
- Stage: ${project.stage}
- Technologies: ${project.technologies?.join(", ") || "none"}
- Location: ${project.location || "unspecified"}
- Full description: ${project.fullDesc?.slice(0, 600)}
- TRL Score: ${assessment?.trlScore || 0}/9
- IR Score: ${assessment?.irScore || 0}/100

Respond ONLY with valid JSON, no markdown:
{
  "alignmentSummary": "<2 sentences summarizing overall thesis fit>",
  "thesisMatches": ["<specific match 1>", "<specific match 2>"],
  "thesisMismatches": ["<specific gap 1>", "<specific gap 2>"],
  "recommendedQuestions": ["<due diligence question 1>", "<due diligence question 2>", "<due diligence question 3>"],
  "strategicScore": <0-100>
}`,
      EXPERTS.strategic,
      500,
    )
      .then((raw) => parseJsonResponse(raw))
      .catch((err) => {
        console.error("[MoE] Strategic expert failed:", err.message);
        return null;
      }),
  ]);

  end();
  llmCallsTotal.inc({ service: "createThesisAlignmentMoE", success: "true" });

const exclusions = investorProfile.exclusions || {};
const industryExcluded = exclusions.industries?.includes(project.industry);
const techExcluded = project.technologies?.some(t =>
  exclusions.technologies?.includes(t)
);
const isExcluded = industryExcluded || techExcluded;

const rawAlignmentScore = Math.round(
  (financialExpert?.financialScore || 0) * 0.4 +
  (strategicExpert?.strategicScore || 0) * 0.6,
);
const alignmentScore = isExcluded ? Math.max(0, rawAlignmentScore - 40) : rawAlignmentScore;

  return {
  alignmentScore,
  alignmentSummary: strategicExpert?.alignmentSummary
    || financialExpert?.financialFit
    || "Alignment analysis unavailable.",
  thesisMatches: strategicExpert?.thesisMatches || [],
  thesisMismatches: strategicExpert?.thesisMismatches || [],
  recommendedQuestions: strategicExpert?.recommendedQuestions || [],
};
}

// ── MoE 3: Pitch Analysis (2 experts)
export async function createPitchAnalysisMoE(project, assessment) {
  console.log("[MoE] Running pitch analysis experts for project:", project.id);
  const end = llmCallDuration.startTimer({ service: "createPitchAnalysisMoE" });

  const [clarityExpert, appealExpert] = await Promise.all([

    // Expert 1 — Clarity & completeness
    callLlm(
      `You are evaluating pitch clarity and completeness.

PROJECT:
- Title: ${project.title}
- Tagline: ${project.tagline}
- Short description: ${project.shortDesc}
- Full description: ${project.fullDesc?.slice(0, 600)}
- Team (${project.teamMembers?.length || 0} members): ${
        project.teamMembers?.map((m) => `${m.name} (${m.role})`).join(", ") || "none listed"
      }
- Milestones (${project.milestones?.length || 0} total, ${
        project.milestones?.filter((m) => m.completedAt)?.length || 0
      } completed): ${project.milestones?.map((m) => m.title).join(", ") || "none"}

Identify what is clearly communicated and what critical information is missing for an investor.

Respond ONLY with valid JSON, no markdown:
{
  "missingElements": ["<missing element as full sentence>", "<missing element as full sentence>"],
  "overallClarity": <0-100>
}`,
      EXPERTS.clarity,
      300,
    )
      .then((raw) => parseJsonResponse(raw))
      .catch((err) => {
        console.error("[MoE] Clarity expert failed:", err.message);
        return null;
      }),

    // Expert 2 — Investor appeal & strengths/weaknesses
    callLlm(
      `You are evaluating investor appeal of a startup pitch.

PROJECT:
- Title: ${project.title}
- Industry: ${project.industry}
- Stage: ${project.stage}
- Full description: ${project.fullDesc?.slice(0, 600)}
- Technologies: ${project.technologies?.join(", ") || "none"}
- Funding sought: ${project.fundingSought} ${project.currency}
- Team size: ${project.teamMembers?.length || 0} members
- Team: ${project.teamMembers?.map((m) => `${m.name} (${m.role})`).join(", ") || "none"}
- Milestones completed: ${project.milestones?.filter((m) => m.completedAt)?.length || 0} / ${project.milestones?.length || 0}
- TRL Score: ${assessment?.trlScore || 0}/9
- IR Score: ${assessment?.irScore || 0}/100

Rule-based profile completeness scores (your analysis must not contradict these):
- Team: ${assessment?.irBreakdown?.team ?? "N/A"}/100
- Market: ${assessment?.irBreakdown?.market ?? "N/A"}/100
- Traction: ${assessment?.irBreakdown?.traction ?? "N/A"}/100
- Financial: ${assessment?.irBreakdown?.financial ?? "N/A"}/100
If a dimension scores 80+, do NOT list it as a weakness. Focus weaknesses on qualitative risks only.

Respond ONLY with valid JSON, no markdown:
{
  "pitchStrengths": ["<strength as full sentence>", "<strength as full sentence>", "<strength as full sentence>"],
  "pitchWeaknesses": ["<weakness as full sentence>", "<weakness as full sentence>"],
  "investorAppeal": <0-100>
}`,
      EXPERTS.appeal,
      350,
    )
      .then((raw) => parseJsonResponse(raw))
      .catch((err) => {
        console.error("[MoE] Appeal expert failed:", err.message);
        return null;
      }),
  ]);

  end();
  llmCallsTotal.inc({ service: "createPitchAnalysisMoE", success: "true" });

  return {
    pitchStrengths: appealExpert?.pitchStrengths || [],
    pitchWeaknesses: appealExpert?.pitchWeaknesses || [],
    missingElements: clarityExpert?.missingElements || [],
    overallClarity: clarityExpert?.overallClarity || 0,
    investorAppeal: appealExpert?.investorAppeal || 0,
  };
}
