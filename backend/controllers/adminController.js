import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";
import { runProjectAssessment } from "../services/assessmentService.js";

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
    setImmediate(() => {
      runProjectAssessment(id)
        .then(() => console.log(`[Admin] Assessment done for project ${id}`))
        .catch((err) =>
          console.error(`[Admin] Assessment failed:`, err.message),
        );
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

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

export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;

    if (!search?.toString().trim()) {
      const users = await prisma.user.findMany({
        where: { ...(role && { role }) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isSuspended: true,
          createdAt: true,
          profile: {
            select: { expertise: true, expertApplicationStatus: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json(users);
    }

    const tsQuery = search
      .toString()
      .trim()
      .split(/\s+/)
      .map((word) => `${word}:*`)
      .join(" & ");

const users = role
  ? await prisma.$queryRaw`
      SELECT u.id, u.name, u.email, u.role, u."isSuspended", u."createdAt",
        json_build_object('expertise', p.expertise, 'expertApplicationStatus', p."expertApplicationStatus") AS profile
      FROM "User" u
      LEFT JOIN "Profile" p ON p."userId" = u.id
      WHERE u.search_vector @@ to_tsquery('english', ${tsQuery})
        AND u.role = ${role}::"Role"
      ORDER BY ts_rank(u.search_vector, to_tsquery('english', ${tsQuery})) DESC
      LIMIT 50`
  : await prisma.$queryRaw`
      SELECT u.id, u.name, u.email, u.role, u."isSuspended", u."createdAt",
        json_build_object('expertise', p.expertise, 'expertApplicationStatus', p."expertApplicationStatus") AS profile
      FROM "User" u
      LEFT JOIN "Profile" p ON p."userId" = u.id
      WHERE u.search_vector @@ to_tsquery('english', ${tsQuery})
      ORDER BY ts_rank(u.search_vector, to_tsquery('english', ${tsQuery})) DESC
      LIMIT 50`;

    res.json(users);
  } catch (error) { next(error); }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const validRoles = ["MEMBER", "EXPERT", "STARTUP", "INVESTOR", "ADMIN"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const updated = await prisma.user.update({ where: { id }, data: { role } });
    res.json(updated);
  } catch (error) { next(error); }
};
export const approveExpert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profile?.expertApplicationStatus !== "PENDING") {
      return res
        .status(400)
        .json({ message: "No pending application for this user" });
    }

    await prisma.user.update({
      where: { id },
      data: { role: "EXPERT" },
    });

    await prisma.profile.upsert({
      where: { userId: id },
      update: {
        expertApplicationStatus: "APPROVED",
      },
      create: {
        userId: id,
        expertise: [],
        expertApplicationStatus: "APPROVED",
      },
    });

    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Application Approved!",
      body: "Congratulations! Your expert application has been approved.",
      link: `/app/profile`,
    });

    res.json({ message: "Expert approved successfully" });
  } catch (error) {
    next(error);
  }
};
export const rejectExpert = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.profile.upsert({
      where: { userId: id },
      update: {
        expertApplicationStatus: "REJECTED",
      },
      create: {
        userId: id,
        expertise: [],
        expertApplicationStatus: "REJECTED",
      },
    });

    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Application Not Approved",
      body: "Your expert application was not approved at this time.",
      link: `/app/profile`,
    });

    res.json({ message: "Application rejected" });
  } catch (error) {
    next(error);
  }
};
export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "ADMIN")
      return res.status(400).json({ message: "Cannot suspend an admin" });

    const updated = await prisma.user.update({
      where: { id },
      data: { isSuspended: true },
    });

    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Account suspended",
      body: "Your account has been suspended by an administrator.",
      link: "/app",
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const unsuspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.user.update({
      where: { id },
      data: { isSuspended: false },
    });

    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Account reactivated",
      body: "Your account has been reactivated. You can now log in.",
      link: "/app",
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const getevents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organizer: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
    });
    res.json(events);
  } catch (error) { next(error); }
};