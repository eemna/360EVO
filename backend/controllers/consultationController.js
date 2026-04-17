import { prisma } from "../config/prisma.js";
import dotenv from "dotenv";
import { createNotification } from "../utils/createNotification.js";
import Stripe from "stripe";
import { bookingsTotal, paymentsTotal } from '../middleware/metrics.js';
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
  console.log("[CB START] body:", JSON.stringify(req.body));
  try {
    const memberId = req.user.id;
    const {
      expertId,
      date,
      timeSlot,
      startDateTimeISO,
      tzOffset = 0,
      duration,
      message,
      topic,
      meetingType,
      location,
      dayOfWeek,
    } = req.body;

    if (!expertId || !date || !timeSlot || !duration) {
      return res.status(400).json({ message: "Missing booking info" });
    }

    const expert = await prisma.user.findUnique({
      where: { id: expertId },
      include: { profile: { include: { weeklyAvailability: true } } },
    });

    if (!expert || expert.role !== "EXPERT") {
      return res.status(404).json({ message: "Expert not found" });
    }

    if (!expert.profile?.hourlyRate) {
      return res.status(400).json({ message: "Expert has no hourly rate set" });
    }

    const startDateTime = startDateTimeISO
      ? new Date(startDateTimeISO)
      : (() => {
          const bookingDate = new Date(date);
          const [hour, minute] = timeSlot.split(":").map(Number);
          bookingDate.setHours(hour, minute, 0, 0);
          return bookingDate;
        })();

    if (startDateTime < new Date()) {
      return res.status(400).json({ message: "Cannot book past time" });
    }

    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + Number(duration));

    // Use dayOfWeek sent from client (local day) — never trust UTC day
    const day = dayOfWeek;

    const availability = expert.profile.weeklyAvailability.find(
      (slot) => slot.day === day && slot.enabled,
    );

    if (!availability || !availability.startTime || !availability.endTime) {
      return res.status(400).json({ message: "Expert not available this day" });
    }

    const [startHour, startMinute] = availability.startTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = availability.endTime.split(":").map(Number);

    const offsetHours = -tzOffset / 60;
    const localHour = startDateTime.getUTCHours() + offsetHours;
    const localMinute = startDateTime.getUTCMinutes();

    const bookingStartMins = localHour * 60 + localMinute;
    const bookingEndMins = bookingStartMins + Number(duration);
    const windowStartMins = startHour * 60 + startMinute;
    const windowEndMins = endHour * 60 + endMinute;

    console.log("[WINDOW CHECK]", {
      bookingStartMins,
      bookingEndMins,
      windowStartMins,
      windowEndMins,
      localHour,
      localMinute,
      tzOffset,
    });

    if (bookingStartMins < windowStartMins || bookingEndMins > windowEndMins) {
      return res
        .status(400)
        .json({ message: "Booking exceeds expert availability window" });
    }

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
      return res
        .status(400)
        .json({ message: "Time overlaps with another booking" });
    }

    if (meetingType === "IN_PERSON" && !location) {
      return res
        .status(400)
        .json({ message: "Location is required for in-person meetings" });
    }

    const price = (Number(expert.profile.hourlyRate) * Number(duration)) / 60;

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
        status: "PENDING",
      },
    });
    bookingsTotal.inc({ status: 'pending' });
    const settings = await getNotifSettings(expertId);
    if (settings.emailOnBooking) {
      await createNotification({
        userId: expertId,
        type: "BOOKING",
        title: "New Booking Request",
        body: `New consultation request: ${topic || "General topic"}`,
        link: "/app/expert/reservations",
      });
    }

    res.status(201).json(booking);
  } catch (error) {
    console.error("Booking error response:", error.response?.data);
    next(error);
  }
};
export const createConsultationPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { expert: { select: { name: true } } },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.memberId !== userId)
      return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({ message: "Booking not awaiting payment" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(booking.price) * 100),
      currency: "usd",
      metadata: {
        userId,
        bookingId: booking.id,
        referenceType: "CONSULTATION",
      },
    });
    paymentsTotal.inc({ type: 'CONSULTATION', status: 'initiated' });
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: Number(booking.price),
      expertName: booking.expert.name,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelUnpaidBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.memberId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "PENDING_PAYMENT") {
      return res
        .status(400)
        .json({ message: "Booking is not awaiting payment" });
    }

    await prisma.booking.delete({ where: { id: req.params.id } });
    res.json({ message: "Booking cancelled" });
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

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.expertId !== req.user.id)
      return res.status(403).json({ message: "Unauthorized" });
    if (booking.status !== "PENDING") {
      return res.status(400).json({ message: "Booking is not pending" });
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: "PENDING_PAYMENT" },
      include: { member: true },
    });
    bookingsTotal.inc({ status: 'accepted' });

    await createNotification({
      userId: booking.memberId,
      type: "BOOKING",
      title: "Booking Accepted — Complete Payment 💳",
      body: `Your consultation request was accepted. Complete payment to confirm your slot.`,
      link: `/app/consultations/${booking.id}/pay`,
    });

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
    bookingsTotal.inc({ status: 'declined' });
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
    bookingsTotal.inc({ status: 'cancelled' });
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
    if (booking.status !== "ACCEPTED") {
      return res
        .status(400)
        .json({ message: "Only accepted bookings can be completed" });
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
      if (global.io) {
        global.io.to(conversation.id).emit("new_message", reviewMessage);
      }
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

    const expertBookings = await prisma.booking.findMany({
      where: { expertId },
      select: { id: true, startDateTime: true, status: true, price: true },
    });

    const bookingIds = expertBookings.map((b) => b.id);

    const allPayments = await prisma.payment.findMany({
      where: {
        referenceType: "CONSULTATION",
        referenceId: { in: bookingIds },
        status: "SUCCEEDED",
      },
      select: { referenceId: true, amount: true, createdAt: true },
    });

    console.log("[EARNINGS DEBUG] expertBookings count:", expertBookings.length);
    console.log("[EARNINGS DEBUG] allPayments count:", allPayments.length);
    console.log("[EARNINGS DEBUG] sample payment:", allPayments[0]);
    console.log("[EARNINGS DEBUG] sample booking id:", expertBookings[0]?.id);

    const usePaymentTable = allPayments.length > 0;

    let totalEarned = 0;
    let completedSessions = 0;
    let thisMonthEarned = 0;
    let thisMonthSessions = 0;

    const startOfMonth = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)
    );

    if (usePaymentTable) {
      totalEarned = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
      completedSessions = allPayments.length;

      const thisMonthPayments = allPayments.filter(
        (p) => new Date(p.createdAt) >= startOfMonth
      );
      thisMonthEarned = thisMonthPayments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
      );
      thisMonthSessions = thisMonthPayments.length;
    } else {
      // Fallback: use completed bookings directly
      const completedBookings = expertBookings.filter(
        (b) => b.status === "COMPLETED"
      );
      totalEarned = completedBookings.reduce(
        (sum, b) => sum + Number(b.price),
        0
      );
      completedSessions = completedBookings.length;

      const thisMonthBookings = completedBookings.filter(
        (b) => new Date(b.startDateTime) >= startOfMonth
      );
      thisMonthEarned = thisMonthBookings.reduce(
        (sum, b) => sum + Number(b.price),
        0
      );
      thisMonthSessions = thisMonthBookings.length;
    }

    // Upcoming: ACCEPTED bookings not yet completed
    const upcomingBookings = expertBookings.filter(
      (b) => b.status === "ACCEPTED"
    );
    const pendingEarnings = upcomingBookings.reduce(
      (sum, b) => sum + Number(b.price),
      0
    );

    res.json({
      totalEarned,
      completedSessions,
      pendingEarnings,
      upcomingSessions: upcomingBookings.length,
      thisMonthEarned,
      thisMonthSessions,
    });
  } catch (error) {
    next(error);
  }
};
