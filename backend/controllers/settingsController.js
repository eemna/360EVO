import { prisma } from "../config/prisma.js";

const DEFAULT_SETTINGS = {
  notifications: {
    emailOnBooking: true,
    emailOnMessage: true,
    emailOnReview: true,
  },
  privacy: {
    showEmail: false,
    showPhone: false,
    profileVisible: true,
  },
};

export const getSettings = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
      select: { settings: true },
    });

    res.json(profile?.settings ?? DEFAULT_SETTINGS);
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { notifications, privacy } = req.body;

    const profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data: {
        settings: {
          notifications: notifications ?? DEFAULT_SETTINGS.notifications,
          privacy: privacy ?? DEFAULT_SETTINGS.privacy,
        },
      },
    });

    res.json(profile.settings);
  } catch (error) {
    next(error);
  }
};

export const toggleTwoFactor = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { enabled } = req.body;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user.role === "ADMIN" && !enabled) {
      return res.status(400).json({
        message: "2FA cannot be disabled for admin accounts",
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: enabled },
    });

    res.json({ message: "2FA settings updated" });
  } catch (error) {
    next(error);
  }
};
