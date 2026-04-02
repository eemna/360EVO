import { callLlm, parseJsonResponse } from "./llmservice.js";


export async function createDocumentRiskScan(documents) {
  const docsWithText = documents.filter((d) => d.textExtract);

  if (docsWithText.length === 0) {
    return {
      riskFlags: ["No extractable text found in uploaded documents"],
      highlights: [],
      overallRiskLevel: "LOW",
      summary: "No document text was available for analysis.",
    };
  }

  const combinedText = docsWithText
    .map((d) => `[Document: ${d.name}]\n${d.textExtract}`)
    .join("\n\n---\n\n");

  const CHUNK_LIMIT = 12000;

  
  if (combinedText.length > CHUNK_LIMIT) {
    const chunks = [];
    for (let i = 0; i < combinedText.length; i += CHUNK_LIMIT) {
      let chunk = combinedText.slice(i, i + CHUNK_LIMIT);
      const lastBreak = chunk.lastIndexOf("\n");
      if (lastBreak > 0) chunk = chunk.slice(0, lastBreak);
      chunks.push(chunk);
    }

    const chunkResults = await Promise.all(
      chunks.map((chunk) =>
        callLlm(
          `Analyse these startup documents for investment risks:\n\n${chunk}\n\nRespond ONLY with JSON: {"riskFlags":["..."],"highlights":["..."]}`,
          "You are a VC due diligence analyst. Find risks and positive signals in startup documents. Respond only in valid JSON, no markdown.",
          400,
        )
          .then((raw) => parseJsonResponse(raw))
          .catch(() => ({ riskFlags: [], highlights: [] })),
      ),
    );

    const merged = {
      riskFlags: chunkResults.flatMap((r) => r.riskFlags || []).slice(0, 8),
      highlights: chunkResults.flatMap((r) => r.highlights || []).slice(0, 6),
      overallRiskLevel: "MEDIUM",
      summary: `Analysis completed across ${docsWithText.length} document(s).`,
    };

    // Recalculate risk level based on flag count
    if (merged.riskFlags.length >= 5) merged.overallRiskLevel = "HIGH";
    else if (merged.riskFlags.length <= 1) merged.overallRiskLevel = "LOW";

    return merged;
  }

  // Single call for smaller documents
  const raw = await callLlm(
    `Analyse these startup documents for investment due diligence:

${combinedText.slice(0, 12000)}

Respond ONLY with valid JSON in exactly this format:
{
  "riskFlags": ["specific risk 1", "specific risk 2"],
  "highlights": ["positive finding 1", "positive finding 2"],
  "overallRiskLevel": "LOW",
  "summary": "2-3 sentence executive summary of the documents"
}`,
    "You are a VC due diligence analyst. Identify investment risks and positive signals. Respond only in valid JSON, no markdown.",
    600,
  );

  return parseJsonResponse(raw);
}


export async function suggestQaAnswer(question, documents) {
  const context = documents
    .filter((d) => d.textExtract)
    .map((d) => `[${d.name}]\n${d.textExtract?.slice(0, 2000)}`)
    .join("\n\n---\n\n");

  if (!context) {
    return {
      suggestedAnswer: "No document content available to answer this question.",
      confidenceLevel: "LOW",
      sourceDocs: [],
    };
  }

  const raw = await callLlm(
    `An investor asked the following question about a startup:
"${question}"

Available documents:
${context.slice(0, 8000)}

Based only on the documents above, draft a concise factual answer.
Respond ONLY with valid JSON:
{
  "suggestedAnswer": "clear answer based on documents",
  "confidenceLevel": "LOW|MEDIUM|HIGH",
  "sourceDocs": ["exact document names used from context"]
}`,
    "You are a startup advisor. Draft honest answers based only on the provided documents. Respond only in valid JSON, no markdown.",
    300,
  );

  return parseJsonResponse(raw);
}

export async function createDealBrief(
  dataRoom,
  project,
  assessment,
  investorProfile,
  riskScanContent,
) {
  const raw = await callLlm(
    `Generate a structured investor deal brief for this startup.
Use only the provided information. Do not invent facts.
PROJECT INFO:
Title: ${project.title}
Tagline: ${project.tagline}
Industry: ${project.industry} | Stage: ${project.stage}
Location: ${project.location || "Not specified"}
Description: ${project.fullDesc?.slice(0, 600)}
Funding sought: ${project.fundingSought} ${project.currency}
Technologies: ${project.technologies?.join(", ") || "none"}
Team size: ${project.teamMembers?.length || 0}

AI SCORES:
TRL Score: ${assessment?.trlScore || 0}/9
IR Score: ${assessment?.irScore || 0}/100
Executive Summary: ${assessment?.executiveSummary || "Not available"}

DOCUMENT RISK SCAN:
Risk flags: ${riskScanContent?.riskFlags?.join("; ") || "None identified"}
Highlights: ${riskScanContent?.highlights?.join("; ") || "None identified"}
Overall risk level: ${riskScanContent?.overallRiskLevel || "Unknown"}

INVESTOR THESIS:
${investorProfile?.investmentThesis || "Not specified"}
Preferred stages: ${investorProfile?.stages?.join(", ") || "Any"}
Preferred industries: ${investorProfile?.industries?.join(", ") || "Any"}

Respond ONLY with valid JSON in exactly this format:
{
  "headline": "one compelling sentence summarising the investment opportunity",
  "companySnapshot": "2-3 sentences describing the company",
  "financialHighlights": "2-3 sentences on funding needs and financial position",
  "marketOpportunity": "2-3 sentences on market size and opportunity",
  "teamStrengths": "1-2 sentences on team quality",
  "keyRisks": ["risk 1", "risk 2", "risk 3"],
  "dueDiligenceFindings": "2-3 sentences summarising document review findings",
  "recommendedNextSteps": ["step 1", "step 2", "step 3"],
  "investorFit": "1-2 sentences on fit with this investor's thesis"
}`,
    "You are a senior VC analyst writing a concise investor deal brief. Be factual and objective. Respond only in valid JSON, no markdown.",
    1500,
  );

  return parseJsonResponse(raw);
}