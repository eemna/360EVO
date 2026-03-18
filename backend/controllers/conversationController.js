import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";

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

    // find conversation where BOTH users are participants
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: currentUserId } } },
          { participants: { some: { userId: otherUserId } } },
        ],
      },
      include: { participants: true },
    });

    if (existing && existing.participants.length === 2) {
      return res.json(existing); // return existing, don't create new
    }

    // Only reaches here if no conversation exists yet
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId: currentUserId }, { userId: otherUserId }],
        },
      },
      include: { participants: true },
    });

    res.json(conversation);
  } catch (error) {
    next(error);
  }
};

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

    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: { not: senderId } },
      select: { userId: true },
    });
    if (otherParticipant) {
      // 1. Emit to recipient's personal room
      global.io.to(otherParticipant.userId).emit("new_message", message);

      // 2. Create notification
      const profile = await prisma.profile.findUnique({
        where: { userId: otherParticipant.userId },
        select: { settings: true },
      });
      const emailOnMessage =
        profile?.settings?.notifications?.emailOnMessage ?? true;

      if (emailOnMessage) {
        await createNotification({
          userId: otherParticipant.userId,
          type: "MESSAGE",
          title: "New Message 💬",
          body: `${req.user.name || "Someone"} sent you a message`,
          link: "/app/conversation",
        });
      }
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

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

    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const otherUser = conv.participants.find(
          (p) => p.userId !== userId,
        )?.user;

        const participant = conv.participants.find((p) => p.userId === userId);

        const unread = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: {
              gt: participant.lastReadAt || new Date(0),
            },
          },
        });

        return {
          id: conv.id,
          createdAt: conv.createdAt,
          otherUser,
          lastMessage: conv.messages[0] || null,
          unread,
        };
      }),
    );

    res.json(formatted);
  } catch (error) {
    next(error);
  }
};

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
export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: id,
        userId,
      },
    });

    if (!participant) {
      return next({ statusCode: 403, message: "Not allowed" });
    }

    await prisma.conversation.delete({
      where: { id },
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
