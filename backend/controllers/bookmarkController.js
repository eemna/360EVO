import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";
import {
  trackBookmark,
  trackInterest,
  trackBookmarkRemove,
} from "./analyticsController.js";
export const addBookmark = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const bookmark = await prisma.bookmark.create({
      data: { userId, projectId },
    });
    trackBookmark(projectId);
    res.status(201).json(bookmark);
  } catch (error) {
    // @@unique violation  already bookmarked
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Already bookmarked" });
    }
    next(error);
  }
};

export const removeBookmark = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    await prisma.bookmark.delete({
      where: { userId_projectId: { userId, projectId } },
    });
    await trackBookmarkRemove(projectId);
    res.json({ message: "Bookmark removed" });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ message: "Bookmark not found" });
    }
    next(error);
  }
};

export const getBookmarks = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          include: {
            owner: { select: { id: true, name: true } },
          },
        },
      },
    });

    res.json(bookmarks.map((b) => b.project));
  } catch (error) {
    next(error);
  }
};

export const getBookmarkIds = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      select: { projectId: true },
    });

    res.json(bookmarks.map((b) => b.projectId));
  } catch (error) {
    next(error);
  }
};

export const expressInterest = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    if (!message?.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { owner: { select: { id: true, name: true } } },
    });

    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId === userId) {
      return res
        .status(400)
        .json({ message: "Cannot express interest in your own project" });
    }

    // 1. Save interest record
    const interest = await prisma.projectInterest.create({
      data: { projectId, userId, message: message.trim() },
      include: { user: { select: { id: true, name: true } } },
    });
    trackInterest(projectId);
    // 2. Find existing conversation between the two users or create new one
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: project.ownerId } } },
        ],
      },
    });

    const conversation =
      existing ??
      (await prisma.conversation.create({
        data: {
          participants: {
            create: [{ userId }, { userId: project.ownerId }],
          },
        },
      }));

    // 3. Send the message into the conversation
    const msg = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: userId,
        content: `[Interest in "${project.title}"] ${message.trim()}`,
      },
    });

    // 4. Emit real-time socket to owner
    if (global.io) {
      global.io.to(project.ownerId).emit("new_message", {
        conversationId: conversation.id,
        message: msg,
      });
    }

    // 5. Notify project owner
    await createNotification({
      userId: project.ownerId,
      type: "PROJECT_UPDATE",
      title: "New interest in your project",
      body: `${interest.user.name} expressed interest in "${project.title}"`,
      link: `/app/conversation`,
    });

    res.status(201).json(interest);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "You already expressed interest in this project" });
    }
    next(error);
  }
};

export const getProjectInterests = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    if (project.ownerId !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const interests = await prisma.projectInterest.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            profile: { select: { avatar: true } },
          },
        },
      },
    });

    res.json(interests);
  } catch (error) {
    next(error);
  }
};
