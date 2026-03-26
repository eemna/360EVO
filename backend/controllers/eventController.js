import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";
import { sendEmail } from "../utils/email.js";

export const getEvents = async (req, res, next) => {
  try {
    const {
      type, // CONFERENCE | NETWORKING | PITCH_DAY | WORKSHOP
      search, // title / description search
      date, // ISO date string — filter events on or after this date
      page = 1,
      limit = 12,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const where = {
      status: "PUBLISHED",
      ...(type && { type }),
      ...(date && {
        OR: [
          { date: { gte: new Date(date) } },
          { endDate: { gte: new Date(date) } },
        ],
      }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { date: "asc" },
        skip,
        take: Number(limit),
        include: {
          organizer: { select: { id: true, name: true } },
          _count: { select: { registrations: true } },
        },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({
      events,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyEvents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user.id },
      orderBy: { date: "asc" },
      include: {
        _count: { select: { registrations: true } },
      },
    });

    res.json(events);
  } catch (error) {
    next(error);
  }
};

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        organizer: { select: { id: true, name: true } },
        registrations: {
          include: {
            user: { select: { id: true, name: true } },
          },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if the requesting user is registered (if authenticated)
    let isRegistered = false;
    if (req.user) {
      isRegistered = event.registrations.some((r) => r.userId === req.user.id);
    }

    res.json({ ...event, isRegistered });
  } catch (error) {
    next(error);
  }
};

export const createEvent = async (req, res, next) => {
  try {
    const { role, id: organizerId } = req.user;
    const {
      title,
      description,
      type,
      date,
      endDate,
      location,
      virtualLink,
      capacity,
      coverImage,
    } = req.body;

    // Role-type validation
    if (role === "EXPERT" && type !== "WORKSHOP") {
      return res
        .status(403)
        .json({ message: "Experts can only create workshops" });
    }

    if (role !== "ADMIN" && role !== "EXPERT") {
      return res
        .status(403)
        .json({ message: "Not authorized to create events" });
    }

    const hostType = role === "ADMIN" ? "ADMIN" : "EXPERT";

    const event = await prisma.event.create({
      data: {
        title,
        description,
        type,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        location: location || null,
        virtualLink: virtualLink || null,
        capacity: capacity ? Number(capacity) : null,
        coverImage: coverImage || null,
        organizerId,
        hostType,
        status: "DRAFT",
      },
      include: {
        organizer: { select: { id: true, name: true } },
      },
    });

    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const {
      title,
      description,
      type,
      date,
      endDate,
      location,
      virtualLink,
      capacity,
      coverImage,
      status,
    } = req.body;

    const updated = await prisma.event.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(type && { type }),
        ...(date && { date: new Date(date) }),
        ...(endDate !== undefined && {
          endDate: endDate ? new Date(endDate) : null,
        }),
        ...(location !== undefined && { location }),
        ...(virtualLink !== undefined && { virtualLink }),
        ...(capacity !== undefined && {
          capacity: capacity ? Number(capacity) : null,
        }),
        ...(coverImage !== undefined && { coverImage }),
        ...(status && { status }),
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not allowed" });
    }

    await prisma.event.delete({ where: { id } });

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const publishEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.organizerId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Not allowed" });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    if (event.status !== "PUBLISHED") {
      return res
        .status(400)
        .json({ message: "Event is not open for registration" });
    }

    // Check capacity
    if (event.capacity && event._count.registrations >= event.capacity) {
      return res.status(400).json({ message: "Event is fully booked" });
    }

    const existing = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Already registered for this event" });
    }

    const registration = await prisma.eventRegistration.create({
      data: { eventId: id, userId },
    });

    await createNotification({
      userId,
      type: "EVENT",
      title: "Registration confirmed",
      body: `You are registered for "${event.title}"`,
      link: `/events/${id}`,
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    const eventDate = new Date(event.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });

    const eventTime = new Date(event.date).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });

    const locationLine = event.location
      ? event.location
      : event.virtualLink
        ? `Online — ${event.virtualLink}`
        : "To be announced";

    sendEmail({
      to: user.email,
      subject: `Registration Confirmed — ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You're registered! 🎉</h1>
          </div>
          <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
            <p style="color: #374151; font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
            <p style="color: #374151;">Your registration has been confirmed for:</p>
            <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <h2 style="color: #1f2937; margin: 0 0 12px 0;">${event.title}</h2>
              <p style="margin: 6px 0; color: #6b7280;">
                <strong style="color: #374151;">Type:</strong> ${event.type.replace("_", " ")}
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
    }).catch((err) => console.error("Confirmation email failed:", err));

    res.status(201).json({ message: "Registered successfully", registration });
  } catch (error) {
    next(error);
  }
};

export const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const registration = await prisma.eventRegistration.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found" });
    }

    await prisma.eventRegistration.delete({
      where: { eventId_userId: { eventId: id, userId } },
    });

    res.json({ message: "Registration cancelled" });
  } catch (error) {
    next(error);
  }
};

export const getMyRegisteredEvents = async (req, res, next) => {
  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { userId: req.user.id },
      include: {
        event: {
          include: {
            organizer: { select: { id: true, name: true } },
            _count: { select: { registrations: true } },
          },
        },
      },
      orderBy: { event: { date: "asc" } },
    });

    const events = registrations.map((r) => r.event);

    res.json(events);
  } catch (error) {
    next(error);
  }
};
