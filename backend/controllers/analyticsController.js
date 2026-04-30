import { prisma } from "../config/prisma.js";

export const trackProjectView = async (projectId, source = "direct") => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const existing = await prisma.projectAnalytics.findUnique({
      where: { projectId_date: { projectId, date: today } },
    });

    const currentSources = existing?.sources ?? {};
    const updatedSources = {
      ...currentSources,
      [source]: (currentSources[source] || 0) + 1,
    };

    await prisma.projectAnalytics.upsert({
      where: { projectId_date: { projectId, date: today } },
      update: {
        views: { increment: 1 },
        sources: updatedSources,
      },
      create: {
        projectId,
        date: today,
        views: 1,
        sources: { [source]: 1 },
      },
    });
  } catch (err) {
    console.error("[Analytics] Failed to track view:", err.message);
  }
};
export const trackBookmark = async (projectId) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  try {
    await prisma.projectAnalytics.upsert({
      where: { projectId_date: { projectId, date: today } },
      update: { bookmarks: { increment: 1 } },
      create: { projectId, date: today, bookmarks: 1 },
    });
  } catch (err) {
    console.error("[Analytics] Failed to track bookmark:", err.message);
  }
};

export const trackInterest = async (projectId) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  try {
    await prisma.projectAnalytics.upsert({
      where: { projectId_date: { projectId, date: today } },
      update: { interests: { increment: 1 } },
      create: { projectId, date: today, interests: 1 },
    });
  } catch (err) {
    console.error("[Analytics] Failed to track interest:", err.message);
  }
};
export const getProjectAnalytics = async (req, res, next) => {
  try {
    const { id: projectId } = req.params;
    const userId = req.user.id;

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
export const trackBookmarkRemove = async (projectId) => {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  try {
    const existing = await prisma.projectAnalytics.findUnique({
      where: { projectId_date: { projectId, date: today } },
    });

    if (!existing || existing.bookmarks <= 0) return;

    await prisma.projectAnalytics.update({
      where: { projectId_date: { projectId, date: today } },
      data: { bookmarks: { decrement: 1 } },
    });
  } catch (err) {
    console.error("[Analytics] Failed to track bookmark remove:", err.message);
  }
};
