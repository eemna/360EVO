import Stripe from "stripe";
import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// POST /api/payments/create-intent
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "PUBLISHED") {
      return res.status(400).json({ message: "Event is not published" });
    }

    const amount = Number(event.price);

    // Free event — no payment needed
    if (amount === 0) {
      return res.status(400).json({
        message: "This event is free. Use the regular registration endpoint.",
      });
    }

    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        eventId_userId: { eventId, userId },
      },
    });

    if (existing) {
      return res.status(400).json({ message: "Already registered for this event" });
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: "usd",
      metadata: {
        userId,
        eventId,
        referenceType: "EVENT",
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
      eventTitle: event.title,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/payments/confirm

export const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return res.status(400).json({ message: "Payment not yet successful" });
    }

    const { eventId, referenceType } = paymentIntent.metadata;

    if (paymentIntent.metadata.userId !== userId) {
      return res.status(403).json({ message: "Payment does not belong to this user" });
    }

    if (referenceType !== "EVENT") {
      return res.status(400).json({ message: "Invalid payment type" });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const expectedAmount = Math.round(Number(event.price) * 100);
    if (paymentIntent.amount !== expectedAmount) {
      return res.status(400).json({ message: "Payment amount does not match event price" });
    }

    // Prevent double-processing
    const existingPayment = await prisma.payment.findUnique({
      where: { stripePaymentIntentId: paymentIntentId },
    });

    if (existingPayment) {
      return res.status(400).json({ message: "Payment already processed" });
    }

    const [payment, registration] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          userId,
          referenceType,
          referenceId: eventId,
          amount: paymentIntent.amount / 100,
          currency: paymentIntent.currency,
          status: "SUCCEEDED",
          stripePaymentIntentId: paymentIntentId,
        },
      }),
      prisma.eventRegistration.create({
        data: { eventId, userId },
      }),
    ]);

    await createNotification({
      userId,
      type: "EVENT",
      title: "Registration Confirmed",
      body: `You're registered for "${event.title}". Payment received.`,
      link: `/app/events/${eventId}`,
    });

    res.json({ payment, registration });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ message: "Already registered for this event" });
    }
    next(error);
  }
};

// POST /api/webhooks/stripe
// Stripe calls this directly signature verification
export const stripeWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
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

  if (!existing) {
    if (referenceType === "EVENT") {
      await prisma.$transaction([
        prisma.payment.create({
          data: {
            userId, referenceType, referenceId: eventId,
            amount: pi.amount / 100, currency: pi.currency,
            status: "SUCCEEDED", stripePaymentIntentId: pi.id,
          },
        }),
        prisma.eventRegistration.upsert({
          where: { eventId_userId: { eventId, userId } },
          update: {},
          create: { eventId, userId },
        }),
      ]);
   } else if (referenceType === "CONSULTATION") {
  const existingBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
  });

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
        meetingLink: existingBooking?.meetingType === "VIDEO"
          ? `https://meet.jit.si/startup-consult-${bookingId}`
          : null,
      },
    }),
  ]);

  await createNotification({
    userId: existingBooking.expertId,
    type: "BOOKING",
    title: "Payment Received",
    body: "Payment confirmed. The session is now locked in.",
    link: "/app/expert/reservations",
  });
}
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

// GET /api/payments/my-payments
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