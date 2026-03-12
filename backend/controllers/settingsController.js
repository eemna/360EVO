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
