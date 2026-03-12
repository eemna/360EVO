import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import { createNotification } from "../utils/createNotification.js";
dotenv.config();

const getNotifSettings = async (userId) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { settings: true },
    });
    return (
      profile?.settings?.notifications ?? {
        emailOnBooking: true,
        emailOnMessage: true,
        emailOnReview: true,
      }
    );
  } catch {
    return { emailOnBooking: true, emailOnMessage: true, emailOnReview: true };
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const memberId = req.user.id;
    const {
      expertId,
      date,
      timeSlot,
      duration,
      message,
      topic,
      meetingType,
      location,
    } = req.body;

    if (!expertId || !date || !timeSlot || !duration) {
      return res.status(400).json({ message: "Missing booking info" });
    }

    const expert = await prisma.user.findUnique({
      where: { id: expertId },
      include: {
        profile: {
          include: { weeklyAvailability: true },
        },
      },
    });

    if (!expert || expert.role !== "EXPERT") {
      return res.status(404).json({ message: "Expert not found" });
    }

    if (!expert.profile?.hourlyRate) {
      return res.status(400).json({ message: "Expert has no hourly rate set" });
    }

    // Build start datetime
    const bookingDate = new Date(date);
    const [hour, minute] = timeSlot.split(":").map(Number);

    const startDateTime = new Date(bookingDate);
    startDateTime.setHours(hour, minute, 0, 0);

    if (startDateTime < new Date()) {
      return res.status(400).json({
        message: "Cannot book past time",
      });
    }

    // Build end datetime
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + duration);

    // Check weekly availability
    const day = startDateTime.getDay();

    const availability = expert.profile.weeklyAvailability.find(
      (slot) => slot.day === day && slot.enabled,
    );

    if (!availability || !availability.startTime || !availability.endTime) {
      return res.status(400).json({
        message: "Expert not available this day",
      });
    }

    const [startHour, startMinute] = availability.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);

    const availableStart = new Date(startDateTime);
    availableStart.setHours(startHour, startMinute, 0, 0);

    const availableEnd = new Date(startDateTime);
    availableEnd.setHours(endHour, endMinute, 0, 0);

    if (startDateTime < availableStart || endDateTime > availableEnd) {
      return res.status(400).json({
        message: "Booking exceeds expert availability window",
      });
    }

    // Check overlap (PROFESSIONAL WAY)
    const overlapping = await prisma.booking.findFirst({
      where: {
        expertId,
        status: { in: ["PENDING", "ACCEPTED"] },
        AND: [
          { startDateTime: { lt: endDateTime } },
          { endDateTime: { gt: startDateTime } },
        ],
      },
    });

    if (overlapping) {
      return res.status(400).json({
        message: "Time overlaps with another booking",
      });
    }
    if (meetingType === "IN_PERSON" && !location) {
      return res.status(400).json({
        message: "Location is required for in-person meetings",
      });
    }
    // Calculate price
    const price = (Number(expert.profile.hourlyRate) * duration) / 60;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        expertId,
        memberId,
        startDateTime,
        endDateTime,
        duration,
        price,
        message,
        topic,
        meetingType,
        location: meetingType === "IN_PERSON" ? location : null,
      },
    });
    const settings = await getNotifSettings(expertId);
    if (settings.emailOnBooking) {
      await createNotification({
        userId: expertId,
        type: "BOOKING",
        title: "New Booking Request 📅",
        body: `New consultation request: ${topic || "General topic"}`,
        link: "/app/expert/reservations",
      });
    }
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
};
export const getConsultations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const bookings = await prisma.booking.findMany({
      where: {
        OR: [{ expertId: userId }, { memberId: userId }],
      },
      include: {
        expert: {
          select: { id: true, name: true },
        },
        member: {
          select: { id: true, name: true },
        },
        review: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(bookings);
  } catch (error) {
    next(error);
  }
};
export const acceptBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.expertId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: "ACCEPTED",
        meetingLink:
          booking.meetingType && booking.meetingType === "VIDEO"
            ? `https://meet.jit.si/startup-consult-${booking.id}`
            : null,
      },
      include: {
        member: true,
      },
    });
    const settings = await getNotifSettings(booking.memberId);
    if (settings.emailOnBooking) {
      await createNotification({
        userId: booking.memberId,
        type: "BOOKING",
        title: "Booking Accepted",
        body: "Your consultation has been accepted.",
        link: `/app/profile/${booking.expertId}`,
      });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const rejectBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.expertId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: "DECLINED",
        rejectionReason: reason || null,
      },
    });
    const settings = await getNotifSettings(booking.memberId);
    if (settings.emailOnBooking) {
      await createNotification({
        userId: booking.memberId,
        type: "BOOKING",
        title: "Booking Declined",
        body: `Your request was declined. Reason: ${reason || "No reason given"}`,
        link: "/app/experts",
      });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const cancelBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // expert and member can cancel the booking
    if (booking.expertId !== req.user.id && booking.memberId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Only accepted bookings can be cancelled
    if (booking.status !== "ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Only confirmed bookings can be cancelled" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: "CANCELLED",
        rejectionReason: reason || null,
      },
    });
    const notifyUserId =
      req.user.id === booking.expertId ? booking.memberId : booking.expertId;

    const cancelledBy =
      req.user.id === booking.expertId ? "The expert" : "The client";

    const settings = await getNotifSettings(notifyUserId);
    if (settings.emailOnBooking) {
      await createNotification({
        userId: notifyUserId,
        type: "BOOKING",
        title: "Session Cancelled",
        body: `${cancelledBy} cancelled the session. Reason: ${reason || "No reason given"}`,
        link:
          req.user.id === booking.expertId
            ? "/app/experts"
            : "/app/expert/reservations",
      });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const completeBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.expertId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: {
        status: "COMPLETED",
      },
    });
    const settings = await getNotifSettings(booking.memberId);
    if (settings.emailOnBooking) {
      await createNotification({
        userId: booking.memberId,
        type: "BOOKING",
        title: "Session Completed 🎉",
        body: "Your consultation is complete. Leave a review!",
        link: `/app/profile/${booking.expertId}`,
      });
    }
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const createReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check 1: only the client (member) can leave a review
    if (booking.memberId !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the client can leave a review" });
    }

    // Check 2: booking must be completed before reviewing
    if (booking.status !== "COMPLETED") {
      return res
        .status(400)
        .json({ message: "Can only review completed sessions" });
    }

    // Check 3: rating must be between 1 and 5
    if (!rating || rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    // Check 4: prevent duplicate review (one per booking)
    const existing = await prisma.review.findUnique({
      where: { consultationId: req.params.id },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "You already reviewed this session" });
    }

    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        expertId: booking.expertId,
        reviewerId: req.user.id,
        consultationId: booking.id,
      },
    });

    // Send review as chat message if conversation exists
    const conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: booking.memberId } } },
          { participants: { some: { userId: booking.expertId } } },
        ],
      },
    });

    if (conversation) {
      const reviewMessage = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: booking.memberId,
          content: `⭐ Left a ${rating}-star review: "${comment || "No comment"}"`,
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
      global.io.to(conversation.id).emit("new_message", reviewMessage);
    }

    const settings = await getNotifSettings(booking.expertId);
    if (settings.emailOnReview) {
      await createNotification({
        userId: booking.expertId,
        type: "BOOKING",
        title: "New Review ⭐",
        body: `You received a ${rating}-star review.`,
        link: `/app/profile/${booking.expertId}`,
      });
    }
    const stats = await prisma.review.aggregate({
      where: { expertId: booking.expertId },
      _avg: { rating: true },
    });

    await prisma.profile.update({
      where: { userId: booking.expertId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        reviewCount: { increment: 1 },
      },
    });

    res.json(review);
  } catch (error) {
    next(error);
  }
};
export const getEarningsOverview = async (req, res, next) => {
  try {
    const expertId = req.user.id;

    // 1. Total earned (all COMPLETED bookings)
    const completed = await prisma.booking.aggregate({
      where: { expertId, status: "COMPLETED" },
      _sum: { price: true },
      _count: true,
    });

    // 2. Pending earnings (ACCEPTED bookings = confirmed but not done yet)
    const pending = await prisma.booking.aggregate({
      where: { expertId, status: "ACCEPTED" },
      _sum: { price: true },
      _count: true,
    });

    // 3. This month's earnings
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonth = await prisma.booking.aggregate({
      where: {
        expertId,
        status: "COMPLETED",
        createdAt: { gte: startOfMonth },
      },
      _sum: { price: true },
      _count: true,
    });

    res.json({
      totalEarned: Number(completed._sum.price ?? 0),
      completedSessions: completed._count,
      pendingEarnings: Number(pending._sum.price ?? 0),
      upcomingSessions: pending._count,
      thisMonthEarned: Number(thisMonth._sum.price ?? 0),
      thisMonthSessions: thisMonth._count,
    });
  } catch (error) {
    next(error);
  }
};
