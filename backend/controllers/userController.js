import { prisma } from "../config/prisma.js";

export const getUserById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        profile: {
          include: {
            weeklyAvailability: true,
          },
        },
        projects: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let computedStatus = null;

    if (user.role === "EXPERT" && user.profile) {
      if (user.profile.availabilityStatus === "UNAVAILABLE") {
        computedStatus = "UNAVAILABLE";
      } else {
        computedStatus = "AVAILABLE"; 

        const today = new Date();
        const todayDay = today.getDay();

        const todayAvailability = user.profile.weeklyAvailability?.find(
          (slot) => slot.day === todayDay && slot.enabled,
        );

        if (
          !todayAvailability ||
          !todayAvailability.startTime ||
          !todayAvailability.endTime
        ) {
          computedStatus = "BUSY";
        } else {
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
              expertId: user.id,
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
    }

    res.json({
      ...user,
      computedStatus, // null for non-experts
    });
  } catch (error) {
    next(error);
  }
};
export const getUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    console.log("getUsers called, currentUserId:", currentUserId);
    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        // isVerified: true,
      },
      select: {
        id: true,
        name: true,
        profile: {
          select: {
            avatar: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });
    console.log("getUsers success, count:", users.length);
    res.json(users);
  } catch (error) {
    console.error("getUsers ERROR:", error.message);

    next(error);
  }
};
