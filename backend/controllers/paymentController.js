import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";
import { paymentsTotal } from "../middleware/metrics.js";
import { sendEmail } from "../utils/email.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "PUBLISHED")
      return res.status(400).json({ message: "Event is not published" });

    const price = event.price.toNumber();

    if (price === 0) {
      return res.status(400).json({ message: "This event is free." });
    }

    const amountInCents = Math.round(price * 100);

    const alreadyRegistered = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (alreadyRegistered)
      return res
        .status(400)
        .json({ message: "Already registered for this event" });

    const application = await prisma.eventApplication.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!application || application.status !== "ACCEPTED") {
      return res.status(403).json({
        message: "Your application must be accepted before payment.",
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: { userId, eventId, referenceType: "EVENT" },
    });

    paymentsTotal.inc({ type: "EVENT", status: "initiated" });
    const amount = event.price.toNumber();

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      eventTitle: event.title,
    });
  } catch (error) {
    next(error);
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ message: `Webhook error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const pi = event.data.object;
        const { userId, eventId, bookingId, referenceType } = pi.metadata;

        const existing = await prisma.payment.findUnique({
          where: { stripePaymentIntentId: pi.id },
        });
        if (existing) {
          console.log(
            "[Webhook] Duplicate, skipping — existing payment:",
            existing.id,
          );
          break;
        }
        if (referenceType === "EVENT") {
          await prisma.$transaction([
            prisma.payment.create({
              data: {
                userId,
                referenceType,
                referenceId: eventId,
                amount: pi.amount / 100,
                currency: pi.currency,
                status: "SUCCEEDED",
                stripePaymentIntentId: pi.id,
              },
            }),

            prisma.eventRegistration.upsert({
              where: { eventId_userId: { eventId, userId } },
              update: {},
              create: { eventId, userId },
            }),
          ]);
          paymentsTotal.inc({ type: "EVENT", status: "succeeded" });
          const dbEvent = await prisma.event.findUnique({
            where: { id: eventId },
          });
          await createNotification({
            userId,
            type: "EVENT",
            title: "Registration Confirmed",
            body: `You're registered for "${dbEvent?.title}".`,
            link: `/app/events/${eventId}`,
          });
          if (dbEvent) {
            await createNotification({
              userId: dbEvent.organizerId,
              type: "EVENT",
              title: "New Registration",
              body: `Someone just registered for "${dbEvent.title}".`,
              link: `/app/events/${eventId}`,
            });
          }

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, email: true },
          });
          if (user && dbEvent) {
            const eventDate = new Date(dbEvent.date).toLocaleDateString(
              "en-US",
              {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
                timeZone: "UTC",
              },
            );

            const eventTime = new Date(dbEvent.date).toLocaleTimeString(
              "en-US",
              {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "UTC",
              },
            );

            const locationLine = dbEvent.location
              ? dbEvent.location
              : dbEvent.virtualLink
                ? `Online — ${dbEvent.virtualLink}`
                : "To be announced";

            sendEmail({
              to: user.email,
              subject: `Registration Confirmed — ${dbEvent.title}`,
              html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 24px;">You're registered! 🎉</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <p style="color: #374151; font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
          <p style="color: #374151;">Your payment was successful and your spot is confirmed for:</p>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h2 style="color: #1f2937; margin: 0 0 12px 0;">${dbEvent.title}</h2>
            <p style="margin: 6px 0; color: #6b7280;">
              <strong style="color: #374151;">Type:</strong> ${dbEvent.type.replace("_", " ")}
            </p>
            <p style="margin: 6px 0; color: #6b7280;">
              <strong style="color: #374151;">Date:</strong> ${eventDate}
            </p>
            <p style="margin: 6px 0; color: #6b7280;">
              <strong style="color: #374151;">Time:</strong> ${eventTime}
            </p>
            <p style="margin: 6px 0; color: #6b7280;">
              <strong style="color: #374151;">Location:</strong> ${locationLine}
            </p>
            <p style="margin: 6px 0; color: #6b7280;">
              <strong style="color: #374151;">Amount Paid:</strong> $${pi.amount / 100}
            </p>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            Manage your registrations from your 
            <a href="${process.env.CLIENT_URL}/app/events/my" style="color: #2563eb;">My Events</a> page.
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">
            © 360EVO — Innovation & Investment Platform
          </p>
        </div>
      </div>
    `,
}).catch((emailErr) => {
  console.error("EVENT email failed:", emailErr.response?.body || emailErr.message);
});
          }
        } else if (referenceType === "CONSULTATION") {
          const booking = await prisma.booking.findUnique({
            where: { id: bookingId },
          });
          if (!booking || booking.status === "ACCEPTED") break;

          await prisma.$transaction([
            prisma.payment.create({
              data: {
                userId,
                referenceType,
                referenceId: bookingId,
                amount: pi.amount / 100,
                currency: pi.currency,
                status: "SUCCEEDED",
                stripePaymentIntentId: pi.id,
              },
            }),

            prisma.booking.update({
              where: { id: bookingId },
              data: {
                status: "ACCEPTED",
                meetingLink:
                  booking.meetingType === "VIDEO"
                    ? `https://meet.jit.si/startup-consult-${bookingId}`
                    : null,
              },
            }),
          ]);
          paymentsTotal.inc({ type: "CONSULTATION", status: "succeeded" });
          await createNotification({
            userId: booking.expertId,
            type: "BOOKING",
            title: "Payment Received ",
            body: "Payment confirmed. The session is now locked in.",
            link: "/app/expert/reservations",
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const pi = event.data.object;

        // Update payment record to FAILED if it exists
        await prisma.payment.updateMany({
          where: { stripePaymentIntentId: pi.id },
          data: { status: "FAILED" },
        });
        paymentsTotal.inc({ type: "UNKNOWN", status: "failed" });
        console.log(`[Webhook] Payment failed: ${pi.id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    // Always return 200 to Stripe — otherwise it retries
    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);
    res.status(500).json({ message: "Webhook processing failed" });
  }
};

export const getMyPayments = async (req, res, next) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(payments);
  } catch (error) {
    next(error);
  }
};
export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== "succeeded")
      return res.status(400).json({ message: "Payment not completed" });
    if (pi.metadata.userId !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    const { eventId } = pi.metadata;

    const [dbEvent, user] = await Promise.all([
      prisma.event.findUnique({ where: { id: eventId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
    ]);

    // Check if webhook already handled this payment
    const existing = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: pi.id },
    });

    if (!existing) {
      console.log(
        "[confirmPayment] Webhook hasn't fired yet — creating records now",
      );

      try {
        await prisma.$transaction([
          prisma.payment.create({
            data: {
              userId,
              referenceType: "EVENT",
              referenceId: eventId,
              amount: pi.amount / 100,
              currency: pi.currency,
              status: "SUCCEEDED",
              stripePaymentIntentId: pi.id,
            },
          }),
          prisma.eventRegistration.upsert({
            where: { eventId_userId: { eventId, userId } },
            update: {},
            create: { eventId, userId },
          }),
        ]);
        console.log("[confirmPayment] Transaction complete");
      } catch (txError) {
        if (txError.code === "P2002") {
          console.log(
            "[confirmPayment] Webhook already created the record, skipping.",
          );
        } else {
          console.error(
            "[confirmPayment] Transaction failed:",
            txError.message,
          );
          throw txError;
        }
      }
    } else {
      console.log(
        "[confirmPayment] Webhook already handled this payment — skipping DB writes",
      );
    }
    await createNotification({
      userId,
      type: "EVENT",
      title: "Registration Confirmed",
      body: `You're registered for "${dbEvent?.title}".`,
      link: `/app/events/${eventId}`,
    });

    if (dbEvent) {
      await createNotification({
        userId: dbEvent.organizerId,
        type: "EVENT",
        title: "New Registration",
        body: `Someone just registered for "${dbEvent.title}".`,
        link: `/app/events/${eventId}`,
      });
    }


    res.json({ success: true });
  } catch (error) {
    console.error("[confirmPayment] ERROR:", error.message);
    next(error);
  }
};

export const createProgramPaymentIntent = async (req, res, next) => {
  try {
    const { programId } = req.body;
    const userId = req.user.id;

    const application = await prisma.programApplication.findUnique({
      where: { programId_userId: { programId, userId } },
      include: { program: true },
    });

    if (!application || application.status !== "ACCEPTED") {
      return res.status(400).json({ message: "No accepted application found" });
    }

    const existing = await prisma.programParticipant.findUnique({
      where: { programId_userId: { programId, userId } },
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Already enrolled in this program" });
    }
    const price = application.program.price.toNumber();

    if (price === 0) {
      return res.status(400).json({ message: "This program is free." });
    }

    const amountInCents = Math.round(price * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      metadata: { userId, programId, referenceType: "PROGRAM" },
    });

    const amount = application.program.price.toNumber();

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      programTitle: application.program.title,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmProgramPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== "succeeded")
      return res.status(400).json({ message: "Payment not completed" });
    if (pi.metadata.userId !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    const { programId } = pi.metadata;

    const [program, user] = await Promise.all([
      prisma.program.findUnique({ where: { id: programId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }),
    ]);

    const existing = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: pi.id },
    });

    if (!existing) {
      try {
        await prisma.$transaction([
          prisma.payment.create({
            data: {
              userId,
              referenceType: "PROGRAM",
              referenceId: programId,
              amount: pi.amount / 100,
              currency: pi.currency,
              status: "SUCCEEDED",
              stripePaymentIntentId: pi.id,
            },
          }),
          prisma.programParticipant.upsert({
            where: { programId_userId: { programId, userId } },
            update: {},
            create: { programId, userId },
          }),
        ]);
      } catch (txError) {
        if (txError.code === "P2002") {
          console.log(
            "[confirmProgramPayment] Webhook already created the record, skipping.",
          );
        } else {
          throw txError;
        }
      }
    }
    await createNotification({
      userId,
      type: "SYSTEM",
      title: "Enrollment Confirmed! 🎉",
      body: `You're now enrolled in "${program?.title}". Welcome!`,
      link: `/app/programs/${programId}`,
    });

    if (program) {
      await createNotification({
        userId: program.organizerId,
        type: "SYSTEM",
        title: "New Participant",
        body: `Someone just enrolled in "${program.title}".`,
        link: `/app/admin`,
      });
    }


    res.json({ success: true });
  } catch (error) {
    console.error("[confirmProgramPayment] ERROR:", error.message);
    next(error);
  }
};
export const confirmConsultationPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (pi.status !== "succeeded")
      return res.status(400).json({ message: "Payment not completed" });
    if (pi.metadata.userId !== userId)
      return res.status(403).json({ message: "Unauthorized" });

    const { bookingId } = pi.metadata;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Check if webhook already handled it
    const existing = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: pi.id },
    });

    if (!existing) {
      try {
        await prisma.$transaction([
          prisma.payment.create({
            data: {
              userId,
              referenceType: "CONSULTATION",
              referenceId: bookingId,
              amount: pi.amount / 100,
              currency: pi.currency,
              status: "SUCCEEDED",
              stripePaymentIntentId: pi.id,
            },
          }),
          prisma.booking.update({
            where: { id: bookingId },
            data: {
              status: "ACCEPTED",
              meetingLink:
                booking.meetingType === "VIDEO"
                  ? `https://meet.jit.si/startup-consult-${bookingId}`
                  : null,
            },
          }),
        ]);
      } catch (txError) {
        if (txError.code === "P2002") {
          console.log(
            "[confirmConsultationPayment] Webhook already handled, skipping.",
          );
        } else {
          throw txError;
        }
      }
    }

    await createNotification({
      userId: booking.expertId,
      type: "BOOKING",
      title: "Payment Received",
      body: "Payment confirmed. The session is now locked in.",
      link: "/app/expert/reservations",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[confirmConsultationPayment] ERROR:", error.message);
    next(error);
  }
};
