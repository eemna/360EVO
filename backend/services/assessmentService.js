import { prisma } from "../config/prisma.js";
import { runRuleBasedScoring } from "./aiScoring.js";
import { runMixtureOfExperts } from "./llmservice.js";
import { generateNarrative } from "./narrativeGenerator.js";

export async function runProjectAssessment(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { teamMembers: true, milestones: true, documents: true, updates: true },
  });
  if (!project) throw new Error(`Project ${projectId} not found`);

  const { trlScore, trlConfidence, irScore, irBreakdown, trlBreakdown, recommendations } =
    runRuleBasedScoring(project);

  const fallbackNarrative = generateNarrative(project, trlScore, irScore, irBreakdown);

  await prisma.aiAssessment.upsert({
    where: { projectId },
    update: {
      trlScore, trlConfidence, trlBreakdown,
      irScore, irBreakdown, recommendations,
      executiveSummary: fallbackNarrative.executiveSummary,
      strengthsNarrative: fallbackNarrative.strengthsNarrative,
      risksNarrative: fallbackNarrative.risksNarrative,
      marketOpportunityNarrative: fallbackNarrative.marketOpportunityNarrative,
      llmModel: "rule-based-template",
      assessedAt: new Date(),
      version: { increment: 1 },
    },
    create: {
      projectId,
      trlScore, trlConfidence, trlBreakdown,
      irScore, irBreakdown, recommendations,
      executiveSummary: fallbackNarrative.executiveSummary,
      strengthsNarrative: fallbackNarrative.strengthsNarrative,
      risksNarrative: fallbackNarrative.risksNarrative,
      marketOpportunityNarrative: fallbackNarrative.marketOpportunityNarrative,
      llmModel: "rule-based-template",
      assessedAt: new Date(),
      version: 1,
    },
  });

  runMixtureOfExperts(project, trlScore, irBreakdown)
    .then(async (narrative) => {
      if (!narrative) return;
      await prisma.aiAssessment.update({
        where: { projectId },
        data: {
          executiveSummary: narrative.executiveSummary ?? null,
          strengthsNarrative: narrative.strengthsNarrative ?? null,
          risksNarrative: narrative.risksNarrative ?? null,
          marketOpportunityNarrative: narrative.marketOpportunityNarrative ?? null,
          llmModel: "groq/moe-4experts",
        },
      });
      console.log(`[Assessment] LLM narrative saved for ${projectId}`);
    })
    .catch((err) => {
      console.warn(`[Assessment] LLM failed for ${projectId}, fallback in place:`, err.message);
    });

  return prisma.aiAssessment.findUnique({ where: { projectId } });
}