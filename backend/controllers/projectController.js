import { prisma } from "../config/prisma.js";
//import { Prisma } from "@prisma/client";
import { createNotification } from "../utils/createNotification.js";
import { trackProjectView } from "./analyticsController.js";
import { runProjectAssessment } from "../services/assessmentService.js";

export const createProject = async (req, res, next) => {
  try {
    console.log("REQ USER:", req.user);
    const { teamMembers, milestones, documents, ...projectData } = req.body;

    const project = await prisma.project.create({
      data: {
        ...projectData,
        ownerId: req.user.id,

        teamMembers: teamMembers?.length ? { create: teamMembers } : undefined,

        milestones: milestones?.length ? { create: milestones } : undefined,

        documents: documents?.length ? { create: documents } : undefined,
        status: "DRAFT",
        visibility: "CONNECTIONS",
      },
      include: {
        teamMembers: true,
        milestones: true,
        documents: true,
      },
    });

    res.status(201).json(project);
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

const project = await prisma.project.findUnique({
  where: { id },
  include: {
    owner: { select: { name: true } },
    teamMembers: true,
    milestones: true,
    documents: true,
    interests: true,
  },
});

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (!req.user || req.user.id !== project.ownerId) {
      await prisma.project.update({
        where: { id },
        data: {
          viewCount: { increment: 1 },
        },
      });
      let source = req.query.source || null;

      if (!source) {
        const referer = req.headers["referer"] || req.headers["referrer"] || "";
        if (referer.includes("google")) source = "google";
        else if (referer.includes("linkedin")) source = "linkedin";
        else if (referer.includes("twitter") || referer.includes("x.com"))
          source = "twitter";
        else if (referer.includes("facebook")) source = "facebook";
        else source = "direct";
      }

      trackProjectView(id, source);
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { teamMembers, milestones, documents, ...projectData } = req.body;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }
if (project.status === "APPROVED") {
  const LOCKED_FIELDS = [
    "title", "fullDesc", "shortDesc", "tagline",
    "fundingSought", "currency", "industry",
    "stage", "technologies"
  ];
  const hasLockedChange = LOCKED_FIELDS.some(
    (field) => projectData[field] !== undefined
  );
  if (hasLockedChange) {
    return res.status(403).json({
      message: "Core fields cannot be edited after approval. Contact admin if changes are needed.",
    });
  }
}

    await prisma.$transaction(
      async (tx) => {
        await tx.project.update({
          where: { id },
          data: projectData,
        });

        if (Array.isArray(teamMembers)) {
          await tx.teamMember.deleteMany({
            where: { projectId: id },
          });

          if (teamMembers.length > 0) {
            await tx.teamMember.createMany({
              data: teamMembers.map((member) => ({
                ...member,
                projectId: id,
              })),
            });
          }
        }

        if (Array.isArray(milestones)) {
          await tx.milestone.deleteMany({
            where: { projectId: id },
          });

          if (milestones.length > 0) {
            await tx.milestone.createMany({
              data: milestones.map((m) => ({
                ...m,
                projectId: id,
              })),
            });
          }
        }

        if (Array.isArray(documents)) {
          await tx.projectDocument.deleteMany({
            where: { projectId: id },
          });

          if (documents.length > 0) {
            await tx.projectDocument.createMany({
              data: documents.map((doc) => ({
                ...doc,
                projectId: id,
              })),
            });
          }
        }
      },
      {
        timeout: 15000,
      },
    );

    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        teamMembers: true,
        milestones: true,
        documents: true,
      },
    });
await prisma.llmInsight.deleteMany({
  where: {
    projectId: id,
    type: { in: ["THESIS_ALIGNMENT", "PITCH_ANALYSIS"] },
  },
});

await prisma.match.deleteMany({
  where: { projectId: id },
});
if (project.status === "APPROVED") {
  setImmediate(() => {
    runProjectAssessment(id)
      .then(() => console.log(`[Project] Re-assessment done for ${id}`))
      .catch((err) => console.error(`[Project] Re-assessment failed:`, err.message));
  });
}

    res.json(updatedProject);
  } catch (error) {
    next(error);
  }
};
export const getMyProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { ownerId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(projects);
  } catch (error) {
    console.error("CREATE PROJECT ERROR:", error);
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!["DRAFT", "REJECTED"].includes(project.status)) {
      return res
        .status(400)
        .json({ message: "Only draft or rejected projects can be deleted" });
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error) {
    next(error);
  }
};
export const getFeaturedProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: {
        featured: true,
        status: "APPROVED",
      },
      take: 6,
      orderBy: { createdAt: "desc" },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};
export const getPublicProjects = async (req, res, next) => {
  try {
    const {
      q,
      industry,
      stage,
      minFunding,
      maxFunding,
      page = 1,
      limit = 12,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    if (q) {
      try {
        const limitNum = Number(limit);
        const offsetNum = Number(skip);

const projects = await prisma.$queryRaw`
  SELECT
    p.id,
    p."ownerId",
    p.title,
    p.tagline,
    p."shortDesc",
    p."fullDesc",
    p.stage,
    p.industry,
    p.technologies,
    p."fundingSought",
    p.currency,
    p.location,
    p.status,
    p.visibility,
    p."viewCount",
    p."createdAt",
    p."updatedAt",
    p.featured,
    ts_rank(p.search_vector, plainto_tsquery('english', ${q})) AS rank,
    u.name AS "ownerName",
    a."trlScore" AS "trlScore"
  FROM "Project" p
  LEFT JOIN "User" u ON u.id = p."ownerId"
  LEFT JOIN "AiAssessment" a ON a."projectId" = p.id
  WHERE
    p.status = 'APPROVED'
    AND p.visibility = 'PUBLIC'
    AND p.search_vector @@ plainto_tsquery('english', ${q})
  ORDER BY rank DESC
  LIMIT ${limitNum}::integer
  OFFSET ${offsetNum}::integer
`;

const shaped = projects.map((p) => ({
  ...p,
  owner: { id: p.ownerId, name: p.ownerName },
  fundingSought: p.fundingSought ? p.fundingSought.toString() : null,
  viewCount: Number(p.viewCount),
  rank: Number(p.rank),
  aiAssessment: p.trlScore != null ? { trlScore: Number(p.trlScore) } : null,
}));

        return res.json(shaped);
      } catch (searchError) {
        console.error("SEARCH ERROR:", searchError);
        return next(searchError);
      }
    }

    const where = {
      status: "APPROVED",
      visibility: "PUBLIC",
      ...(industry && { industry }),
      ...(stage && { stage }),
      ...(minFunding && { fundingSought: { gte: Number(minFunding) } }),
      ...(maxFunding && { fundingSought: { lte: Number(maxFunding) } }),
    };

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
      include: {
        owner: {
          select: { id: true, name: true },
        },
        aiAssessment: {
      select: { trlScore: true },
    },
      },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};
export const submitProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (!project.title || !project.shortDesc || !project.fullDesc) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { status: "PENDING", visibility: "CONNECTIONS" },
    });
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "PROJECT_UPDATE",
          title: "New project pending review",
          body: `"${project.title}" was submitted for review`,
          link: `/app/startup/projects/${id}`,
        }),
      ),
    );
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const updateTeamMemberPhoto = async (req, res, next) => {
  try {
    const { projectId, teamMemberId } = req.params;
    const { fileUrl } = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const updated = await prisma.teamMember.update({
      where: { id: teamMemberId },
      data: { photo: fileUrl },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const getStartupDashboard = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const { q } = req.query;
    const [totalProjects, totalViews, pending, approved, draft, projects] =
      await Promise.all([
        prisma.project.count({ where: { ownerId } }),
        prisma.project.aggregate({
          where: { ownerId },
          _sum: { viewCount: true },
        }),
        prisma.project.count({ where: { ownerId, status: "PENDING" } }),
        prisma.project.count({ where: { ownerId, status: "APPROVED" } }),
        prisma.project.count({ where: { ownerId, status: "DRAFT" } }),
        prisma.project.findMany({
          where: {
            ownerId,
            ...(q && {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { shortDesc: { contains: q, mode: "insensitive" } },
                { tagline: { contains: q, mode: "insensitive" } },
              ],
            }),
          },
          include: { teamMembers: true },
          orderBy: { createdAt: "desc" },
        }),
      ]);

    res.json({
      stats: {
        totalProjects,
        totalViews: totalViews._sum.viewCount || 0,
        pending,
        approved,
        draft,
      },
      projects,
    });
  } catch (error) {
    next(error);
  }
};
export const createProjectUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content, imageUrl } = req.body;
    const userId = req.user.id;

    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.ownerId !== userId) {
      return res.status(403).json({ message: "Not allowed" });
    }

    if (project.status !== "APPROVED") {
      return res
        .status(400)
        .json({ message: "Can only post updates on approved projects" });
    }

    const update = await prisma.projectUpdate.create({
      data: {
        projectId: id,
        content: content.trim(),
        imageUrl: imageUrl || null,
      },
    });

    res.status(201).json(update);
  } catch (error) {
    next(error);
  }
};

export const getProjectUpdates = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    const updates = await prisma.projectUpdate.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
    });

    res.json(updates);
  } catch (error) {
    next(error);
  }
};
