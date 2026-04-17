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

      if (existing && existing.participants.length === 2) {
        return existing;
      }

      return await tx.conversation.create({
        data: {
          participants: {
            create: [
              { userId: currentUserId },
              { userId: otherUserId },
            ],
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

const message = await prisma.$transaction(async (tx) => {
  const msg = await tx.message.create({
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
          profile: { select: { avatar: true } },
        },
      },
    },
  });

  await tx.conversation.update({
    where: { id },
    data: { lastMessageAt: new Date() },
  });

  return msg;
});

    global.io.to(id).emit("new_message", message);


        const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentionedUserIds = new Set();
    let match;
    while ((match = mentionRegex.exec(content)) !== null) {
      const mentionedId = match[2]; 
      if (mentionedId && mentionedId !== senderId) {
        mentionedUserIds.add(mentionedId);
      }
    }

    for (const mentionedUserId of mentionedUserIds) {
      const mentionedUser = await prisma.user.findUnique({
        where: { id: mentionedUserId },
        select: { id: true },
      });
      if (!mentionedUser) continue;

      await createNotification({
        userId: mentionedUserId,
        type: "MESSAGE",
        title: "You were mentioned 💬",
        body: `${req.user.name || "Someone"} mentioned you in a message`,
        link: "/app/conversation",
      });

      global.io.to(mentionedUserId).emit("notification", {
        type: "MENTION",
        from: req.user.name,
        conversationId: id,
      });
    }


    const otherParticipant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: id, userId: { not: senderId } },
      select: { userId: true },
    });
    if (otherParticipant) {
      global.io.to(otherParticipant.userId).emit("new_message", message);

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
6
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
        lastMessageAt: { sort: "desc", nulls: "last" },
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

export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 1) return res.json([]);

    const tsQuery = q.trim().split(/\s+/).map(word => `${word}:*`).join(' & ');

    const users = await prisma.$queryRaw`
      SELECT 
        u.id, 
        u.name,
        json_build_object('avatar', p.avatar) as profile
      FROM "User" u
      LEFT JOIN "Profile" p ON p."userId" = u.id
      WHERE u.search_vector @@ to_tsquery('english', ${tsQuery})
        AND u.id != ${req.user.id}
      ORDER BY ts_rank(
        u.search_vector, 
        to_tsquery('english', ${tsQuery})
      ) DESC
      LIMIT 5
    `;

    res.json(users);
  } catch (error) {
    next(error);
  }
};