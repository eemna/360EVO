import { prisma } from "../config/prisma.js";

// get all notifications for the logged-in user
export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 30, // last 30 notifications
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

// mark one as read
export const markOneRead = async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(notification);
  } catch (error) {
    next(error);
  }
};

// mark all as read
export const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
export const clearAllNotifications = async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.user.id },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
