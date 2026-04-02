import { prisma } from "../config/prisma.js";
import { runRuleBasedScoring } from "./aiScoring.js";
import { runMixtureOfExperts } from "./llmservice.js";
import { generateNarrative } from "./narrativeGenerator.js";

export async function runProjectAssessment(projectId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      teamMembers: true,
      milestones: true,
      documents: true,
      updates: true,
    },
  });

  if (!project) throw new Error(`Project ${projectId} not found`);

  const { trlScore, trlConfidence, irScore, irBreakdown,trlBreakdown, recommendations } =
    runRuleBasedScoring(project);

let narrative = await runMixtureOfExperts(project, trlScore, irBreakdown);
  if (!narrative) {
    narrative = generateNarrative(project, trlScore, irScore, irBreakdown);
  }
    const llmModel = narrative._expertsUsed ? "groq/moe-4experts" : "rule-based-template";

  return prisma.aiAssessment.upsert({
    where: { projectId },
    update: {
      trlScore,
      trlConfidence,
      trlBreakdown,
      irScore,
      irBreakdown,
      recommendations,
      executiveSummary: narrative?.executiveSummary ?? null,
      strengthsNarrative: narrative?.strengthsNarrative ?? null,
      risksNarrative: narrative?.risksNarrative ?? null,
      marketOpportunityNarrative: narrative?.marketOpportunityNarrative ?? null,
      llmModel, 
      assessedAt: new Date(),
      version: { increment: 1 },
    },
    create: {
      projectId,
      trlScore,
      trlConfidence,
      trlBreakdown,
      irScore,
      irBreakdown,
      recommendations,
      executiveSummary: narrative?.executiveSummary ?? null,
      strengthsNarrative: narrative?.strengthsNarrative ?? null,
      risksNarrative: narrative?.risksNarrative ?? null,
      marketOpportunityNarrative: narrative?.marketOpportunityNarrative ?? null,
      llmModel, 
      assessedAt: new Date(),
      version: 1,
    },
  });
}
