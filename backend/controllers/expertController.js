import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import { createNotification } from "../utils/createNotification.js";
import { getEffectiveAvailability } from "../services/availabilityService.js";
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
        //total booking duration
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

{
  /*export const getExperts = async (req, res, next) => {
  try {
    const experts = await prisma.user.findMany({
      where: {
        role: "EXPERT",
        isSuspended: false,
      },
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
      orderBy: { profile: { avgRating: "desc" } },
    });

    res.json({ experts });
  } catch (error) {
    next(error);
  }
};*/
}
export const getExperts = async (req, res, next) => {
  try {
    const {
      search,
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

    const profileFilters = {
      ...(expertise && { expertise: { has: expertise } }),
      ...(industry && { industries: { has: industry } }),
      ...(maxRate && { hourlyRate: { lte: Number(maxRate) } }),
      ...(minRating && { avgRating: { gte: Number(minRating) } }),
    };

    const where = {
      role: "EXPERT",
      isSuspended: false,
      ...(Object.keys(profileFilters).length > 0 && {
        profile: { is: profileFilters },
      }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          {
            profile: { is: { bio: { contains: search, mode: "insensitive" } } },
          },
        ],
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


export const getExpertAvailability = async (req, res, next) => {
  try {
    const { id: expertId } = req.params;
    const { month } = req.query; 
    const profile = await prisma.profile.findUnique({
      where: { userId: expertId },
    });
    if (!profile) return res.status(404).json({ message: "Expert not found" });

    const [year, monthNum] = month.split("-").map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    const now = new Date();
    const minNoticeMs = (profile.minNoticeHours ?? 0) * 60 * 60 * 1000;
    const horizonMs =
      profile.bookingHorizonDays != null
        ? profile.bookingHorizonDays * 24 * 60 * 60 * 1000
        : null;

    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(Date.UTC(year, monthNum - 1, d));

      if (date.getTime() + 24 * 60 * 60 * 1000 - minNoticeMs < now.getTime()) continue;
      if (horizonMs != null && date.getTime() - now.getTime() > horizonMs) continue;

      const availability = await getEffectiveAvailability(profile.id, date);
      if (availability) {
        result.push({
          date: date.toISOString().slice(0, 10),
          startTime: availability.startTime,
          endTime: availability.endTime,
        });
      }
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateAvailabilitySettings = async (req, res, next) => {
  try {
    const { minNoticeHours, bookingHorizonDays } = req.body;
    const updated = await prisma.profile.update({
      where: { userId: req.user.id },
      data: { minNoticeHours, bookingHorizonDays },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const listAvailabilityOverrides = async (req, res, next) => {
  try {
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });
    const overrides = await prisma.availabilityOverride.findMany({
      where: { profileId: profile.id },
      orderBy: { date: "asc" },
    });
    res.json(overrides);
  } catch (error) {
    next(error);
  }
};

export const upsertAvailabilityOverride = async (req, res, next) => {
  try {
    const { date, isAvailable, startTime, endTime } = req.body;
    const profile = await prisma.profile.findUnique({ where: { userId: req.user.id } });

    const dayStart = new Date(date);
    dayStart.setUTCHours(0, 0, 0, 0);

    const override = await prisma.availabilityOverride.upsert({
      where: { profileId_date: { profileId: profile.id, date: dayStart } },
      update: { isAvailable, startTime, endTime },
      create: { profileId: profile.id, date: dayStart, isAvailable, startTime, endTime },
    });
    res.json(override);
  } catch (error) {
    next(error);
  }
};

export const deleteAvailabilityOverride = async (req, res, next) => {
  try {
    await prisma.availabilityOverride.delete({ where: { id: req.params.id } });
    res.json({ message: "Override removed" });
  } catch (error) {
    next(error);
  }
};