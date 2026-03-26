import Groq from "groq-sdk";


export async function callLlm(prompt, systemPrompt, maxTokens = 1000) {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy-key-for-tests" });
  const MAX_RETRIES = 3;
  let attempt = 0;

  while (attempt < MAX_RETRIES) {
    const start = Date.now();
    try {
      const response = await groq.chat.completions.create({
        model:       "llama-3.1-8b-instant",
        max_tokens:  maxTokens,
        temperature: 0.3,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user",   content: prompt },
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
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      } else {
        console.error(`[LLM] Failed after ${attempt + 1} attempts:`, error.message);
        throw error;
      }
    }
  }
}

// parseJsonResponse — safely parse LLM JSON output
// Strips markdown code fences if model adds them
export function parseJsonResponse(raw) {
  const cleaned = raw
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m,     "")
    .replace(/\s*```$/m,     "")
    .trim();

  return JSON.parse(cleaned);
}

// createProjectNarrative
// Called by POST /api/ai/assess/:projectId after rule-based scoring
export async function createProjectNarrative(project, trlScore, irBreakdown) {
  const systemPrompt =
    "You are a venture capital analyst. Respond ONLY in JSON, no markdown, no explanation.";

  const prompt = `Analyze this startup and generate a professional investment assessment narrative.

PROJECT:
- Title: ${project.title}
- Industry: ${project.industry}
- Stage: ${project.stage}
- Location: ${project.location || "Not specified"}
- Technologies: ${project.technologies?.join(", ") || "Not specified"}
- Tagline: ${project.tagline}
- Short Description: ${project.shortDesc}
- Full Description: ${project.fullDesc?.slice(0, 600)}
- Team Members: ${project.teamMembers?.length || 0}
- Milestones: ${project.milestones?.length || 0} planned, ${project.milestones?.filter(m => m.completedAt)?.length || 0} completed
- Funding Sought: ${project.fundingSought ? `${project.currency} ${project.fundingSought}` : "Not specified"}

SCORES:
- TRL Score: ${trlScore}/9
- IR Breakdown: ${JSON.stringify(irBreakdown)}

Respond ONLY with this JSON:
{
  "executiveSummary": "<2-3 sentence professional summary>",
  "strengthsNarrative": "<2 sentences about strongest points>",
  "risksNarrative": "<2 sentences about main risks>",
  "marketOpportunityNarrative": "<2 sentences about market opportunity>"
}`;

  try {
    const raw    = await callLlm(prompt, systemPrompt, 600);
    const result = parseJsonResponse(raw);

    const required = [
      "executiveSummary",
      "strengthsNarrative",
      "risksNarrative",
      "marketOpportunityNarrative",
    ];

    for (const field of required) {
      if (!result[field] || typeof result[field] !== "string") {
        throw new Error(`Missing or invalid field: ${field}`);
      }
    }

    return result;
  } catch (error) {
    console.error("[LLM] createProjectNarrative failed:", error.message);
    return null;
  }
}

// createThesisAlignment
// Called by POST /api/ai/thesis-alignment/:projectId
export async function createThesisAlignment(investorProfile, project, assessment) {
  const systemPrompt =
    "You are a venture capital analyst. Respond ONLY in JSON, no markdown, no explanation.";

  const prompt = `Analyze the alignment between this investor's thesis and a startup project.

INVESTOR THESIS:
${investorProfile.investmentThesis || "Not specified"}

INVESTOR MUST-HAVES:
${JSON.stringify(investorProfile.mustHaves || {})}

INVESTOR EXCLUSIONS:
${JSON.stringify(investorProfile.exclusions || {})}

PROJECT:
- Title: ${project.title}
- Industry: ${project.industry}
- Stage: ${project.stage}
- Technologies: ${project.technologies?.join(", ") || "Not specified"}
- Description: ${project.fullDesc?.slice(0, 800)}

AI SCORES:
- TRL Score: ${assessment?.trlScore || "N/A"}/9
- IR Score: ${assessment?.irScore || "N/A"}/100

Respond ONLY with this JSON:
{
  "alignmentScore": <integer 0-100>,
  "alignmentSummary": "<2-3 sentence professional summary>",
  "thesisMatches": ["<specific match>", "<another match>"],
  "thesisMismatches": ["<specific gap>", "<another gap>"],
  "recommendedQuestions": ["<DD question>", "<another question>", "<another question>"]
}`;

  try {
    const raw    = await callLlm(prompt, systemPrompt, 600);
    const result = parseJsonResponse(raw);

    return {
      alignmentScore:       Number(result.alignmentScore)    || 0,
      alignmentSummary:     result.alignmentSummary          || "",
      thesisMatches:        result.thesisMatches             || [],
      thesisMismatches:     result.thesisMismatches          || [],
      recommendedQuestions: result.recommendedQuestions      || [],
    };
  } catch (error) {
    console.error("[LLM] createThesisAlignment failed:", error.message);
    return null;
  }
}

// createPitchAnalysis
// Called by POST /api/ai/pitch-analysis/:projectId
export async function createPitchAnalysis(project, assessment) {
  const systemPrompt =
    "You are a venture capital analyst. Respond ONLY in JSON, no markdown, no explanation.";

  const teamList = project.teamMembers
    ?.map(m => `${m.name} (${m.role})`)
    .join(", ") || "Not specified";

  const milestoneList = project.milestones
    ?.map(m => `${m.title}${m.completedAt ? " ✓" : ""}`)
    .join(", ") || "None";

  const prompt = `Analyze this startup pitch from an investor perspective.

PROJECT:
- Title: ${project.title}
- Industry: ${project.industry}
- Stage: ${project.stage}
- Description: ${project.fullDesc?.slice(0, 600)}
- Technologies: ${project.technologies?.join(", ") || "Not specified"}
- Team: ${teamList}
- Milestones: ${milestoneList}
- Funding Sought: ${project.fundingSought ? `${project.currency} ${project.fundingSought}` : "Not specified"}

AI SCORES:
- TRL Score: ${assessment?.trlScore || "N/A"}/9
- IR Score: ${assessment?.irScore || "N/A"}/100
- IR Breakdown: ${JSON.stringify(assessment?.irBreakdown || {})}

Respond ONLY with this JSON:
{
  "pitchStrengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "pitchWeaknesses": ["<weakness 1>", "<weakness 2>"],
  "missingElements": ["<missing element 1>", "<missing element 2>"],
  "overallClarity": <integer 0-100>,
  "investorAppeal": <integer 0-100>
}`;

  try {
    const raw    = await callLlm(prompt, systemPrompt, 500);
    const result = parseJsonResponse(raw);

    return {
      pitchStrengths:  result.pitchStrengths  || [],
      pitchWeaknesses: result.pitchWeaknesses || [],
      missingElements: result.missingElements || [],
      overallClarity:  Number(result.overallClarity) || 0,
      investorAppeal:  Number(result.investorAppeal)  || 0,
    };
  } catch (error) {
    console.error("[LLM] createPitchAnalysis failed:", error.message);
    return null;
  }
}