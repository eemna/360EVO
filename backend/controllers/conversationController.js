// controllers/conversationController.js

import { prisma } from "../config/prisma.js";

/**
 * POST /api/conversations
 */
export const createConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return next({ statusCode: 400, message: "otherUserId required" });
    }

    if (otherUserId === currentUserId) {
      return next({ statusCode: 400, message: "Cannot message yourself" });
    }

    const conversation = await prisma.$transaction(async (tx) => {
      const existing = await tx.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: currentUserId } } },
            { participants: { some: { userId: otherUserId } } },
          ],
        },
        include: { participants: true },
      });

      if (existing) return existing;

      return tx.conversation.create({
        data: {
          participants: {
            create: [{ userId: currentUserId }, { userId: otherUserId }],
          },
        },
        include: { participants: true },
      });
    });

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/conversations/:id/messages
 */
export const sendMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const senderId = req.user.id;

    if (!content?.trim()) {
      return next({ statusCode: 400, message: "Message content required" });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: senderId },
    });

    if (!participant) {
      return next({ statusCode: 403, message: "Not allowed" });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        senderId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { avatar: true },
            },
          },
        },
      },
    });

    global.io.to(id).emit("new_message", message);

    res.json(message);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/conversations/:id/messages
 */
export const getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { cursor } = req.query;
    const userId = req.user.id;

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId },
    });

    if (!participant) {
      return next({ statusCode: 403, message: "Not allowed" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profile: {
              select: { avatar: true },
            },
          },
        },
      },
    });

    res.json({
      messages: messages.reverse(),
      nextCursor:
        messages.length === 50 ? messages[messages.length - 1].id : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/conversations, This returns conversation list for sidebar.
 */
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                profile: { select: { avatar: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = conversations.map((conv) => {
      const otherUser = conv.participants.find(
        (p) => p.userId !== userId,
      )?.user;

      return {
        id: conv.id,
        createdAt: conv.createdAt,
        otherUser,
        lastMessage: conv.messages[0] || null,
      };
    });

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/conversations/messages/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const userId = req.user.id;

    if (!conversationId) {
      return next({ statusCode: 400, message: "conversationId required" });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });

    if (!participant) {
      return next({ statusCode: 403, message: "Not allowed" });
    }

    const updated = await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    global.io.to(conversationId).emit("message_read", {
      conversationId,
      userId,
      lastReadAt: updated.lastReadAt,
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
