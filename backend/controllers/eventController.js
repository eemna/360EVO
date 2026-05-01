import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";
// import { sendEmail } from "../utils/email.js";

export const getEvents = async (req, res, next) => {
  try {
    const { type, search, dateFrom, dateTo, page = 1, limit = 6 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const now = new Date();

    if (!search?.toString().trim()) {
      const where = {
        status: "PUBLISHED",
        ...(type && { type }),
        ...(dateFrom && dateTo
          ? {
              AND: [
                {
                  OR: [
                    {
                      date: { gte: new Date(dateFrom), lte: new Date(dateTo) },
                    },
                    {
                      endDate: {
                        gte: new Date(dateFrom),
                        lte: new Date(dateTo),
                      },
                    },
                  ],
                },
                {
                  OR: [
                    { endDate: { gte: now } },
                    { endDate: null, date: { gte: now } },
                  ],
                },
              ],
            }
          : {
              OR: [
                { endDate: { gte: now } },
                { endDate: null, date: { gte: now } },
              ],
            }),
      };

      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          orderBy: { date: "asc" },
          skip,
          take,
          include: {
            organizer: { select: { id: true, name: true } },
            _count: { select: { registrations: true } },
          },
        }),
        prisma.event.count({ where }),
      ]);

      return res.json({
        events,
        pagination: {
          total,
          page: Number(page),
          limit: take,
          totalPages: Math.ceil(total / take),
        },
      });
    }

    const tsQuery = search
      .toString()
      .trim()
      .split(/\s+/)
      .map((word) => `${word}:*`)
      .join(" & ");

    const events = await prisma.$queryRaw`
      SELECT
        e.id, e.title, e.description, e.type, e.date, e."endDate",
        e.location, e."virtualLink", e.capacity, e."coverImage",
        e.status, e.price,
        json_build_object('id', u.id, 'name', u.name) AS organizer,
        json_build_object('registrations', COUNT(er.id)::int) AS "_count"
      FROM "Event" e
      LEFT JOIN "User" u ON u.id = e."organizerId"
      LEFT JOIN "EventRegistration" er ON er."eventId" = e.id
      WHERE e.status = 'PUBLISHED'
        AND e.search_vector @@ to_tsquery('english', ${tsQuery})
      GROUP BY e.id, u.id, u.name
      ORDER BY ts_rank(e.search_vector, to_tsquery('english', ${tsQuery})) DESC
      LIMIT ${take} OFFSET ${skip}
    `;

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM "Event" e
      WHERE e.status = 'PUBLISHED'
        AND e.search_vector @@ to_tsquery('english', ${tsQuery})
    `;

    const total = countResult[0]?.total ?? 0;

    return res.json({
      events,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
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
          include: { user: { select: { id: true, name: true } } },
        },
        _count: { select: { registrations: true } },
      },
    });

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    let isRegistered = false;
    let applicationStatus = null;

    if (req.user) {
      isRegistered = event.registrations.some((r) => r.userId === req.user.id);

      if (!isRegistered) {
        const application = await prisma.eventApplication.findUnique({
          where: {
            eventId_userId: { eventId: id, userId: req.user.id },
          },
        });
        if (application) {
          applicationStatus = application.status;
        }
      }
    }

    res.json({ ...event, isRegistered, applicationStatus });
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
      price,
    } = req.body;

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
        price: price ? Number(price) : 0,
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
      price,
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
        ...(price !== undefined && { price: Number(price) }),
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

export const applyToEvent = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.status !== "PUBLISHED")
      return res.status(400).json({ message: "Event is not open" });

    if (new Date() > new Date(event.endDate ?? event.date)) {
      return res.status(400).json({ message: "This event has already ended" });
    }

    if (event.capacity) {
      const regCount = await prisma.eventRegistration.count({
        where: { eventId },
      });
      if (regCount >= event.capacity)
        return res.status(400).json({ message: "Event is fully booked" });
    }

    const existing = await prisma.eventApplication.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (existing)
      return res.status(400).json({ message: "Already applied to this event" });

    const application = await prisma.eventApplication.create({
      data: { eventId, userId, status: "PENDING" },
    });

    await createNotification({
      userId: event.organizerId,
      type: "EVENT",
      title: "New Event Application",
      body: `Someone applied to join "${event.title}".`,
      link: `/app/events/${eventId}`,
    });

    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
};

export const getMyEventApplications = async (req, res, next) => {
  try {
    const applications = await prisma.eventApplication.findMany({
      where: { userId: req.user.id },
      include: {
        event: { include: { organizer: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
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

    if (registration) {
      await prisma.eventRegistration.delete({
        where: { eventId_userId: { eventId: id, userId } },
      });
      return res.json({ message: "Registration cancelled" });
    }

    const application = await prisma.eventApplication.findUnique({
      where: { eventId_userId: { eventId: id, userId } },
    });

    if (application) {
      await prisma.eventApplication.delete({
        where: { eventId_userId: { eventId: id, userId } },
      });
      return res.json({ message: "Application cancelled" });
    }

    return res
      .status(404)
      .json({ message: "No registration or application found" });
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
