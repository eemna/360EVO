import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import { createNotification } from "../utils/createNotification.js";
dotenv.config();

export const getPublicExpertProfile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expert = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: {
          include: { weeklyAvailability: true },
        },
        expertReviews: {
          take: 10,
          orderBy: { createdAt: "desc" },
          include: {
            reviewer: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!expert || expert.role !== "EXPERT") {
      return res.status(404).json({ message: "Expert not found" });
    }

    let computedStatus = "AVAILABLE";

    if (expert.profile?.availabilityStatus === "UNAVAILABLE") {
      computedStatus = "UNAVAILABLE";
    } else {
      const today = new Date();
      const todayDay = today.getUTCDay();

      const todayAvailability = expert.profile.weeklyAvailability.find(
        (slot) => slot.day === todayDay && slot.enabled,
      );

      if (todayAvailability) {
        // Check if fully booked today
        const [startHour, startMinute] = todayAvailability.startTime
          .split(":")
          .map(Number);

        const [endHour, endMinute] = todayAvailability.endTime
          .split(":")
          .map(Number);

        const availableStart = new Date(today);
        availableStart.setHours(startHour, startMinute, 0, 0);

        const availableEnd = new Date(today);
        availableEnd.setHours(endHour, endMinute, 0, 0);

        const bookingsToday = await prisma.booking.findMany({
          where: {
            expertId: expert.id,
            status: { in: ["PENDING", "ACCEPTED"] },
            startDateTime: {
              gte: availableStart,
              lt: availableEnd,
            },
          },
        });

        const bookedMinutes = bookingsToday.reduce(
          (total, booking) => total + booking.duration,
          0,
        );

        const totalAvailableMinutes =
          (availableEnd - availableStart) / (1000 * 60);

        if (bookedMinutes >= totalAvailableMinutes) {
          computedStatus = "BUSY";
        }
      }
    }

    res.json({
      ...expert,
      computedStatus,
    });
  } catch (error) {
    next(error);
  }
};

export const getExperts = async (req, res, next) => {
  try {
    const {
      expertise,
      industry,
      maxRate,
      minRating,
      page = 1,
      limit = 12,
      sort = "rating",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    const profileWhere = {
      ...(expertise && { expertise: { has: expertise } }),
      ...(industry && { industries: { has: industry } }),
      ...(maxRate && { hourlyRate: { lte: Number(maxRate) } }),
      ...(minRating && { avgRating: { gte: Number(minRating) } }),
    };

    const where = {
      role: "EXPERT",
      isSuspended: false,
      ...(Object.keys(profileWhere).length > 0 && {
        profile: { is: profileWhere },
      }),
    };

    const orderBy =
      sort === "rate_asc"
        ? { profile: { hourlyRate: "asc" } }
        : sort === "rate_desc"
          ? { profile: { hourlyRate: "desc" } }
          : sort === "experience"
            ? { profile: { yearsOfExperience: "desc" } }
            : { profile: { avgRating: "desc" } };

    const [experts, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          profile: {
            select: {
              avatar: true,
              bio: true,
              expertise: true,
              industries: true,
              hourlyRate: true,
              currency: true,
              yearsOfExperience: true,
              avgRating: true,
              reviewCount: true,
              availabilityStatus: true,
            },
          },
        },
        orderBy,
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      experts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
export const applyExpert = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check user is not already an expert or pending
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (user.role === "EXPERT") {
      return res.status(400).json({ message: "You are already an expert" });
    }

    if (user.profile?.expertApplicationStatus === "PENDING") {
      return res
        .status(400)
        .json({ message: "Application already pending review" });
    }

    const profile = await prisma.profile.upsert({
      where: { userId },
      update: {
        expertApplicationStatus: "PENDING",
      },
      create: {
        userId,
        expertise: [],
        industries: [],
        expertApplicationStatus: "PENDING",
      },
    });

    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        createNotification({
          userId: admin.id,
          type: "SYSTEM",
          title: "New Expert Application",
          body: `${user.name} has applied to become an expert.`,
          link: `/app/admin/experts`,
        }),
      ),
    );

    res.json({
      message: "Application submitted. Pending admin review.",
      profile,
    });
  } catch (error) {
    console.error("APPLY EXPERT ERROR:", error.message);
    next(error);
  }
};
