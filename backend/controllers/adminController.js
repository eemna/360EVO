import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";

//  Get pending projects
export const getPendingProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "PENDING" },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

//  Approve project
export const approveProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.project.update({
      where: { id },
      data: { status: "APPROVED", visibility: "PUBLIC" },
    });
    await createNotification({
      userId: updated.ownerId,
      type: "PROJECT_UPDATE",
      title: "🎉 Project approved!",
      body: `Your project "${updated.title}" has been approved and is now live.`,
      link: `/app/startup/projects/${id}`,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

//  Reject project
export const rejectProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.project.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    await createNotification({
      userId: updated.ownerId,
      type: "PROJECT_UPDATE",
      title: "Project rejected",
      body: `Your project "${updated.title}" was not approved. Please review and resubmit.`,
      link: `/app/startup/projects/${id}`,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

//  Get all users
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(users);
  } catch (error) {
    next(error);
  }
};

// Update user role
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
