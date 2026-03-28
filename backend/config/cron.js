import cron from "cron";
import https from "https";
import { prisma } from "../config/prisma.js";
import { calculateMatchScore } from "../services/matchingEngine.js";
import { generateNarrative } from "../services/narrativeGenerator.js";

const job = new cron.CronJob("*/10 * * * *", function () {
  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

const matchRegenerationJob = new cron.CronJob("0 2 * * *", async function () {
  console.log("[CRON] Starting daily match regeneration...");

  try {
    // Get all investor profiles
    const investors = await prisma.investorProfile.findMany();

    if (investors.length === 0) {
      console.log("[CRON] No investors found, skipping.");
      return;
    }

    // Get all approved projects with assessments
    const projects = await prisma.project.findMany({
      where: { status: "APPROVED" },
      include: {
        teamMembers: true,
        milestones: true,
        documents: true,
        updates: true,
        aiAssessment: true,
      },
    });

    if (projects.length === 0) {
      console.log("[CRON] No approved projects found, skipping.");
      return;
    }

    let totalMatches = 0;

    for (const investorProfile of investors) {
      const matchResults = [];

      for (const project of projects) {
        const { matchScore, categoryScores, reasoning } =
          await calculateMatchScore(
            investorProfile,
            project,
            project.aiAssessment,
          );
        matchResults.push({
          investorId: investorProfile.userId,
          projectId: project.id,
          matchScore,
          categoryScores,
          reasoning,
        });
      }

      // Batch upsert matches for this investor
      await Promise.all(
        matchResults.map((match) =>
          prisma.match.upsert({
            where: {
              investorId_projectId: {
                investorId: match.investorId,
                projectId: match.projectId,
              },
            },
            update: {
              matchScore: match.matchScore,
              categoryScores: match.categoryScores,
              reasoning: match.reasoning,
            },
            create: {
              investorId: match.investorId,
              projectId: match.projectId,
              matchScore: match.matchScore,
              categoryScores: match.categoryScores,
              reasoning: match.reasoning,
              status: "SUGGESTED",
            },
          }),
        ),
      );

      totalMatches += matchResults.length;
    }

    console.log(
      `[CRON] Match regeneration complete. ${totalMatches} matches updated.`,
    );
  } catch (error) {
    console.error("[CRON] Match regeneration failed:", error);
  }
});

// ─────────────────────────────────────────────────────────────
// JOB 3 — Retry failed narratives (Sprint 5 LLM Epic Task 5)
// Runs every 30 minutes
// Finds AiAssessment rows where executiveSummary is null and retries
// Max 3 retries per project (tracked via version field)
// ─────────────────────────────────────────────────────────────
const narrativeRetryJob = new cron.CronJob("*/30 * * * *", async function () {
  console.log("[CRON] Checking for failed narratives...");

  try {
    // Find assessments with no narrative yet, version <= 3 (max 3 retries)
    const failedAssessments = await prisma.aiAssessment.findMany({
      where: {
        executiveSummary: null,
        version: { lte: 3 },
      },
      include: {
        project: {
          include: {
            teamMembers: true,
            milestones: true,
            documents: true,
            updates: true,
          },
        },
      },
    });

    if (failedAssessments.length === 0) {
      console.log("[CRON] No failed narratives found.");
      return;
    }

    console.log(
      `[CRON] Retrying ${failedAssessments.length} failed narratives...`,
    );

    for (const assessment of failedAssessments) {
      try {
        const narrative = generateNarrative(
          assessment.project,
          assessment.trlScore,
          assessment.irScore,
          assessment.irBreakdown,
        );

        await prisma.aiAssessment.update({
          where: { id: assessment.id },
          data: {
            executiveSummary: narrative.executiveSummary,
            strengthsNarrative: narrative.strengthsNarrative,
            risksNarrative: narrative.risksNarrative,
            marketOpportunityNarrative: narrative.marketOpportunityNarrative,
            version: { increment: 1 },
          },
        });

        console.log(
          `[CRON] Narrative generated for project ${assessment.projectId}`,
        );
      } catch (err) {
        console.error(
          `[CRON] Failed to generate narrative for ${assessment.projectId}:`,
          err,
        );
      }
    }
  } catch (error) {
    console.error("[CRON] Narrative retry job failed:", error);
  }
});

// ─────────────────────────────────────────────────────────────
// Export all jobs — server.js starts them in production
// ─────────────────────────────────────────────────────────────
export { job, matchRegenerationJob, narrativeRetryJob };

// Default export keeps backward compatibility with server.js
export default job;
