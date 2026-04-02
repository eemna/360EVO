import { prisma } from "../config/prisma.js";

// Called internally whenever a project is viewed
export const trackProjectView = async (projectId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    await prisma.projectAnalytics.upsert({
      where: { projectId_date: { projectId, date: today } },
      update: { views: { increment: 1 } },
      create: { projectId, date: today, views: 1 },
    });
  } catch (err) {
    console.error("[Analytics] Failed to track view:", err.message);
  }
};

// GET /api/projects/:id/analytics?range=7d|30d|90d
export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;

    // Only owner can see analytics
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId !== userId)
      return res.status(403).json({ message: "Forbidden" });

    const rangeMap = { "90d": 90, "30d": 30, "7d": 7 };
    const days = rangeMap[req.query.range] || 7;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const analytics = await prisma.projectAnalytics.findMany({
      where: { projectId, date: { gte: since } },
      orderBy: { date: "asc" },
    });

    // Summary totals
    const totals = analytics.reduce(
      (acc, row) => {
        acc.views += row.views;
        acc.bookmarks += row.bookmarks;
        acc.interests += row.interests;
        return acc;
      },
      { views: 0, bookmarks: 0, interests: 0 },
    );

    res.json({ analytics, totals, range: req.query.range || "7d" });
  } catch (error) {
    next(error);
  }
};
