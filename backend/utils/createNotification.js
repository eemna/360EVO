import { prisma } from "../config/prisma.js";

export const createNotification = async ({
  userId,
  type,
  title,
  body,
  link,
}) => {
  // 1. Save to database
  const notification = await prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      link: link || null,
      isRead: false,
    },
  });

  // 2. Emit real-time socket event to that user's personal room
  if (global.io) {
    global.io.to(userId).emit("new_notification", notification);
  }

  return notification;
};
