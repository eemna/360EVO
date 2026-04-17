import cron from "cron";
import https from "https";
import { prisma } from "../config/prisma.js";
import { calculateMatchScore } from "../services/matchingEngine.js";
import { generateNarrative } from "../services/narrativeGenerator.js";
import { runMixtureOfExperts } from "../services/llmservice.js";
import {
  cronJobRuns,
  cronJobDuration,
  cronMatchesUpdated,
  cronNarrativesRetried,
} from '../middleware/metrics.js';
const job = new cron.CronJob("*/10 * * * *", function () {
  https
    .get(process.env.API_URL, (res) => {
      if (res.statusCode === 200) console.log("GET request sent successfully");
      else console.log("GET request failed", res.statusCode);
    })
    .on("error", (e) => console.error("Error while sending request", e));
});

const matchRegenerationJob = new cron.CronJob("0 2 * * *", async function () {
  const end = cronJobDuration.startTimer({ job: 'match_regeneration' });
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
    cronMatchesUpdated.set(totalMatches);
    cronJobRuns.inc({ job: 'match_regeneration', status: 'success' });
    console.log(
      `[CRON] Match regeneration complete. ${totalMatches} matches updated.`,
    );
  } catch (error) {
    cronJobRuns.inc({ job: 'match_regeneration', status: 'failed' });
    console.error("[CRON] Match regeneration failed:", error);
  }
   finally {
  end(); 
}
});

// Finds AiAssessment rows where executiveSummary is null and retries
// Max 3 retries per project (tracked via version field)
const narrativeRetryJob = new cron.CronJob("*/30 * * * *", async function () {
  const end = cronJobDuration.startTimer({ job: 'narrative_retry' });
  console.log("[CRON] Checking for failed LLM narratives...");

  try {
    const failedAssessments = await prisma.aiAssessment.findMany({
      where: {
        llmModel: "rule-based-template",
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
        let narrative = await runMixtureOfExperts(
          assessment.project,
          assessment.trlScore,
          assessment.irBreakdown,
        );

        if (!narrative) {
          console.warn(
            `[CRON] LLM failed again for ${assessment.projectId}, using rule-based fallback`,
          );
          narrative = generateNarrative(
            assessment.project,
            assessment.trlScore,
            assessment.irScore,
            assessment.irBreakdown,
          );
        }

        await prisma.aiAssessment.update({
          where: { id: assessment.id },
          data: {
            executiveSummary: narrative.executiveSummary ?? null,
            strengthsNarrative: narrative.strengthsNarrative ?? null,
            risksNarrative: narrative.risksNarrative ?? null,
            marketOpportunityNarrative:
              narrative.marketOpportunityNarrative ?? null,
            llmModel: narrative._expertsUsed
              ? "groq/moe-4experts"
              : "rule-based-template",
            version: { increment: 1 },
          },
        });

        console.log(
          `[CRON] Narrative filled for project ${assessment.projectId}`,
        );
      } catch (err) {
        await prisma.aiAssessment
          .update({
            where: { id: assessment.id },
            data: { version: { increment: 1 } },
          })
          .catch(() => {});

        console.error(
          `[CRON] Retry failed for ${assessment.projectId}:`,
          err.message,
        );
      }
    }
  cronNarrativesRetried.inc();

    cronJobRuns.inc({ job: 'narrative_retry', status: 'success' });
  } catch (error) {
    cronJobRuns.inc({ job: 'narrative_retry', status: 'failed' });
    console.error("[CRON] Narrative retry job failed:", error);
  } finally {
  end(); 
}
});

// Runs at midnight every day — ensures today's analytics row exists for active projects
const analyticsJob = new cron.CronJob("0 0 * * *", async function () {
   const end = cronJobDuration.startTimer({ job: 'analytics' });
  console.log(
    "[CRON] Midnight analytics: ensuring today's rows exist for active projects",
  );
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Just ensure every approved project has a row for today
    // (views/bookmarks/interests are tracked in real-time, this is just insurance)
    const projects = await prisma.project.findMany({
      where: { status: "APPROVED" },
      select: { id: true },
    });

    for (const project of projects) {
      await prisma.projectAnalytics.upsert({
        where: { projectId_date: { projectId: project.id, date: today } },
        update: {},
        create: { projectId: project.id, date: today },
      });
    }
    console.log(
      `[CRON] Ensured analytics rows for ${projects.length} projects`,
    );
    cronJobRuns.inc({ job: 'analytics', status: 'success' });
  } catch (err) {
    cronJobRuns.inc({ job: 'analytics', status: 'failed' });
    console.error("[CRON] Analytics job failed:", err.message);
  } finally {
  end(); 
}
});
export { job, matchRegenerationJob, narrativeRetryJob, analyticsJob };

export default job;
