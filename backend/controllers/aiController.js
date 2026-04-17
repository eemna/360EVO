import { prisma } from "../config/prisma.js";
import { calculateMatchScore } from "../services/matchingEngine.js";
import crypto from "crypto";
import {
  createThesisAlignmentMoE,
  createPitchAnalysisMoE,
} from "../services/llmservice.js";
import { matchesGenerated, matchScoreHistogram, llmCacheHits } from '../middleware/metrics.js';
import { runProjectAssessment } from "../services/assessmentService.js";

// Scores a project — called after admin approves it
export const assessProject = async (req, res, next) => {
  try {
    const assessment = await runProjectAssessment(req.params.projectId);
    res.json(assessment);
  } catch (error) {
    next(error);
  }
};

// Returns the full AI assessment for a project
export const getAssessment = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    const assessment = await prisma.aiAssessment.findUnique({
      where: { projectId },
    });

    if (!assessment) {
      return res
        .status(404)
        .json({ message: "No assessment found for this project" });
    }

    res.json(assessment);
  } catch (error) {
    next(error);
  }
};

// Computes match scores between current investor and all approved projects
export const generateMatches = async (req, res, next) => {
  try {
    const investorId = req.user.id;
    
    const investorProfile = await prisma.investorProfile.findUnique({
  where: { userId: investorId },
}) ?? {
  industries: [], stages: [], technologies: [],
  fundingMin: null, fundingMax: null,
  geographicPrefs: [], riskTolerance: "MEDIUM",
  dealStructures: [], mustHaves: {}, exclusions: {},
  investmentThesis: "",
};
    /* const investorProfile = await prisma.investorProfile.findUnique({
      where: { userId: investorId },
    }); */
    // if (!investorProfile) {
    //  return res
      //  .status(400)
      //  .json({ message: "Please complete your investor profile first" });
    //}

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
      return res.json({ message: "No approved projects found", matches: [] });
    }

    const matchResults = [];
    for (const project of projects) {
      const { matchScore, categoryScores, reasoning } =
        await calculateMatchScore(
          investorProfile,
          project,
          project.aiAssessment,
        );
      matchResults.push({
        investorId,
        projectId: project.id,
        matchScore,
        categoryScores,
        reasoning,
        project,
      });
      matchesGenerated.inc();
      matchScoreHistogram.observe(matchScore);
    }

    await Promise.all(
      matchResults.map(({ project: _p, ...match }) =>
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
            status: "SUGGESTED",
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

    await prisma.match.updateMany({
      where: { investorId },
      data: { thesisAlignmentSummary: null },
    });

    const sorted = matchResults.sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      message: `Generated ${matchResults.length} matches`,
      matches: sorted,
    });

    setImmediate(async () => {
      const top10 = sorted.slice(0, 10);
      console.log(
        `[Matches] Enqueueing thesis alignment for top ${top10.length} matches...`,
      );

      for (const match of top10) {
        try {
          const inputHash = crypto
            .createHash("sha256")
            .update(
              (investorProfile.investmentThesis || "") +
                (match.project.fullDesc || ""),
            )
            .digest("hex");

          const cached = await prisma.llmInsight.findUnique({
            where: {
              investorId_projectId_type: {
                investorId,
                projectId: match.projectId,
                type: "THESIS_ALIGNMENT",
              },
            },
          });
          if (cached && cached.inputHash === inputHash) {
            llmCacheHits.inc({ type: 'THESIS_ALIGNMENT' }); 
            console.log(`[Matches] Cached for ${match.projectId}, skipping`);
            continue;
          }

          const alignment = await createThesisAlignmentMoE(
            investorProfile,
            match.project,
            match.project.aiAssessment,
          );
          if (!alignment) continue;

          await prisma.llmInsight.upsert({
            where: {
              investorId_projectId_type: {
                investorId,
                projectId: match.projectId,
                type: "THESIS_ALIGNMENT",
              },
            },
            update: { content: alignment, inputHash },
            create: {
              investorId,
              projectId: match.projectId,
              type: "THESIS_ALIGNMENT",
              content: alignment,
              inputHash,
            },
          });

          await prisma.match.updateMany({
            where: { investorId, projectId: match.projectId },
            data: { thesisAlignmentSummary: alignment.alignmentSummary },
          });

          console.log(
            `[Matches] Thesis alignment saved for ${match.projectId}`,
          );
        } catch (err) {
          console.error(
            `[Matches] Thesis alignment failed for ${match.projectId}:`,
            err.message,
          );
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Returns the investor's match feed ordered by score
export const getMatchFeed = async (req, res, next) => {
  try {
    const investorId = req.user.id;
    const showDismissed = req.query.dismissed === "true";

    const matches = await prisma.match.findMany({
      where: {
        investorId,
        ...(showDismissed ? {} : { status: { not: "DISMISSED" } }),
      },
      orderBy: { matchScore: "desc" },
      include: {
        project: {
          include: {
            owner: { select: { name: true, email: true } },
            teamMembers: true,
            aiAssessment: true,

            llmInsights: {
              where: {
                investorId,
                type: "THESIS_ALIGNMENT",
              },
              take: 1,
            },
          },
        },
      },
    });

    const enriched = matches.map((match) => {
      const insight = match.project.llmInsights?.[0];
      return {
        ...match,
        thesisAlignmentSummary:
          match.thesisAlignmentSummary ??
          insight?.content?.alignmentSummary ??
          null,
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
};

// Investor dismisses or restores a match
export const updateMatchStatus = async (req, res, next) => {
  try {
    const { matchId } = req.params;
    const { status } = req.body;
    const investorId = req.user.id;

    const validStatuses = ["SUGGESTED", "VIEWED", "CONTACTED", "DISMISSED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const match = await prisma.match.findFirst({
      where: { id: matchId, investorId },
    });

    if (!match) {
      return res.status(404).json({ message: "Match not found" });
    }

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { status },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const getThesisAlignment = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const investorId = req.user.id;

    // 1. Get investor profile
    const investorProfile = await prisma.investorProfile.findUnique({
      where: { userId: investorId },
    });
    if (!investorProfile) {
      return res
        .status(400)
        .json({ message: "Complete your investor profile first." });
    }

    // 2. Get project with assessment
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { aiAssessment: true },
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // 3. Build input hash — skip LLM call if nothing changed
    const inputHash = crypto
      .createHash("sha256")
      .update((investorProfile.investmentThesis || "") + project.fullDesc)
      .digest("hex");

    // 4. Check cache first
    const cached = await prisma.llmInsight.findUnique({
      where: {
        investorId_projectId_type: {
          investorId,
          projectId,
          type: "THESIS_ALIGNMENT",
        },
      },
    });
    if (cached && cached.inputHash === inputHash) {
      llmCacheHits.inc({ type: 'THESIS_ALIGNMENT' });
      return res.json({ cached: true, data: cached.content });
    }

    // 5. Call llmService — Groq LLaMA generates the analysis
    const alignment = await createThesisAlignmentMoE(
      investorProfile,
      project,
      project.aiAssessment,
    );

    if (!alignment) {
      return res
        .status(503)
        .json({ message: "Thesis alignment temporarily unavailable." });
    }

    // 6. Save to LlmInsight cache
    await prisma.llmInsight.upsert({
      where: {
        investorId_projectId_type: {
          investorId,
          projectId,
          type: "THESIS_ALIGNMENT",
        },
      },
      update: { content: alignment, inputHash },
      create: {
        investorId,
        projectId,
        type: "THESIS_ALIGNMENT",
        content: alignment,
        inputHash,
      },
    });

    // 7. Update Match.thesisAlignmentSummary
    await prisma.match.updateMany({
      where: { investorId, projectId },
      data: { thesisAlignmentSummary: alignment.alignmentSummary },
    });

    res.json({ cached: false, data: alignment });
  } catch (error) {
    next(error);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const insights = await prisma.llmInsight.findMany({
      where: { investorId: req.user.id, projectId: req.params.projectId },
    });
    res.json(insights);
  } catch (error) {
    next(error);
  }
};

export const getPitchAnalysis = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const investorId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { teamMembers: true, milestones: true, aiAssessment: true },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Build hash from project data only (cached per project, not per investor)
    const inputHash = crypto
      .createHash("sha256")
      .update(project.fullDesc + project.updatedAt.toString())
      .digest("hex");

    // Check cache — investorId is null for project-level cache
    const cached = await prisma.llmInsight.findUnique({
      where: {
        investorId_projectId_type: {
          investorId: investorId,
          projectId,
          type: "PITCH_ANALYSIS",
        },
      },
    });

    if (cached && cached.inputHash === inputHash) {
      return res.json({ cached: true, data: cached.content });
    }

    // Call LLM via llmService
    const analysis = await createPitchAnalysisMoE(
      project,
      project.aiAssessment,
    );

    if (!analysis) {
      return res
        .status(503)
        .json({ message: "Pitch analysis temporarily unavailable." });
    }

    // Save to LlmInsight cache
    await prisma.llmInsight.upsert({
      where: {
        investorId_projectId_type: {
          investorId: investorId,
          projectId,
          type: "PITCH_ANALYSIS",
        },
      },
      update: { content: analysis, inputHash },
      create: {
        investorId,
        projectId,
        type: "PITCH_ANALYSIS",
        content: analysis,
        inputHash,
      },
    });

    res.json({ cached: false, data: analysis });
  } catch (error) {
    next(error);
  }
};
