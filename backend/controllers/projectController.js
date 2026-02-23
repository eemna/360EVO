import { prisma } from "../config/prisma.js";
import { Prisma } from "@prisma/client";
export const createProject = async (req, res, next) => {
  try {
    console.log("REQ USER:", req.user);
    const { teamMembers, milestones, documents, ...projectData } = req.body;

    const project = await prisma.project.create({
      data: {
        ...projectData,
        ownerId: req.user.id,

        teamMembers: teamMembers?.length
  ? { create: teamMembers }
  : undefined,

milestones: milestones?.length
  ? { create: milestones }
  : undefined,

documents: documents?.length
  ? { create: documents }
  : undefined,
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
  res.status(500).json({ error: error.message });
}
};

export const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        teamMembers: true,
        milestones: true,
        documents: true,
      },
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    await prisma.project.update({
      where: { id },
      data: {
        viewCount: { increment: 1 },
      },
    });

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

    await prisma.$transaction(async (tx) => {
      // Update main project
      await tx.project.update({
        where: { id },
        data: projectData,
      });

      // Replace teamMembers
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

      // Replace milestones
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

      // Replace documents
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
    });

    const updatedProject = await prisma.project.findUnique({
      where: { id },
      include: {
        teamMembers: true,
        milestones: true,
        documents: true,
      },
    });

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
  res.status(500).json({ error: error.message });
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

    if (project.status !== "DRAFT") {
      return res.status(400).json({ message: "Only draft can be deleted" });
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

    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [`status = 'APPROVED'`];
    const values = [];
    let paramIndex = 1;

    if (q) {
      conditions.push(
        `search_vector @@ plainto_tsquery('english', $${paramIndex})`
      );
      values.push(q);
      paramIndex++;
    }

    if (industry) {
      conditions.push(`industry = $${paramIndex}`);
      values.push(industry);
      paramIndex++;
    }

    if (stage) {
      conditions.push(`stage = $${paramIndex}`);
      values.push(stage);
      paramIndex++;
    }

    if (minFunding) {
      conditions.push(`"fundingSought" >= $${paramIndex}`);
      values.push(Number(minFunding));
      paramIndex++;
    }

    if (maxFunding) {
      conditions.push(`"fundingSought" <= $${paramIndex}`);
      values.push(Number(maxFunding));
      paramIndex++;
    }

    const whereClause = conditions.join(" AND ");

    const projects = await prisma.$queryRaw`
  SELECT *
  FROM "Project"
  WHERE ${Prisma.raw(whereClause)}
  ORDER BY "createdAt" DESC
  LIMIT ${Number(limit)} OFFSET ${offset}
`;

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
      data: { status: "PENDING" },
    });

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