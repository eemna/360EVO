import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";
import { runProjectAssessment } from "../services/assessmentService.js";
import { sendEmail } from "../utils/email.js";

export const getPendingProjects = async (req, res, next) => {
  try {
    const projects = await prisma.project.findMany({
      where: { status: "PENDING" },
      include: {
        owner: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(projects);
  } catch (error) {
    next(error);
  }
};

export const approveProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.project.update({
      where: { id },
      data: { status: "APPROVED", visibility: "PUBLIC" },
    });
    await createNotification({
      userId: updated.ownerId,
      type: "PROJECT_UPDATE",
      title: "🎉 Project approved!",
      body: `Your project "${updated.title}" has been approved and is now live.`,
      link: `/app/startup/projects/${id}`,
    });
    setImmediate(() => {
      runProjectAssessment(id)
        .then(() => console.log(`[Admin] Assessment done for project ${id}`))
        .catch((err) =>
          console.error(`[Admin] Assessment failed:`, err.message),
        );
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const rejectProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.project.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    await createNotification({
      userId: updated.ownerId,
      type: "PROJECT_UPDATE",
      title: "Project rejected",
      body: `Your project "${updated.title}" was not approved. Please review and resubmit.`,
      link: `/app/startup/projects/${id}`,
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;

    if (!search?.toString().trim()) {
      const users = await prisma.user.findMany({
        where: { ...(role && { role }) },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isSuspended: true,
          createdAt: true,
          profile: {
            select: { expertise: true, expertApplicationStatus: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json(users);
    }

    const tsQuery = search
      .toString()
      .trim()
      .split(/\s+/)
      .map((word) => `${word}:*`)
      .join(" & ");

    const users = role
      ? await prisma.$queryRaw`
      SELECT u.id, u.name, u.email, u.role, u."isSuspended", u."createdAt",
        json_build_object('expertise', p.expertise, 'expertApplicationStatus', p."expertApplicationStatus") AS profile
      FROM "User" u
      LEFT JOIN "Profile" p ON p."userId" = u.id
      WHERE u.search_vector @@ to_tsquery('english', ${tsQuery})
        AND u.role = ${role}::"Role"
      ORDER BY ts_rank(u.search_vector, to_tsquery('english', ${tsQuery})) DESC
      LIMIT 50`
      : await prisma.$queryRaw`
      SELECT u.id, u.name, u.email, u.role, u."isSuspended", u."createdAt",
        json_build_object('expertise', p.expertise, 'expertApplicationStatus', p."expertApplicationStatus") AS profile
      FROM "User" u
      LEFT JOIN "Profile" p ON p."userId" = u.id
      WHERE u.search_vector @@ to_tsquery('english', ${tsQuery})
      ORDER BY ts_rank(u.search_vector, to_tsquery('english', ${tsQuery})) DESC
      LIMIT 50`;

    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (id === req.user.id) {
      return res.status(400).json({ message: "Cannot change your own role" });
    }

    const validRoles = ["MEMBER", "EXPERT", "STARTUP", "INVESTOR", "ADMIN"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const updated = await prisma.user.update({ where: { id }, data: { role } });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const approveExpert = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.profile?.expertApplicationStatus !== "PENDING") {
      return res
        .status(400)
        .json({ message: "No pending application for this user" });
    }

    await prisma.user.update({
      where: { id },
      data: { role: "EXPERT" },
    });

    await prisma.profile.upsert({
      where: { userId: id },
      update: {
        expertApplicationStatus: "APPROVED",
      },
      create: {
        userId: id,
        expertise: [],
        expertApplicationStatus: "APPROVED",
      },
    });

    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Application Approved!",
      body: "Congratulations! Your expert application has been approved.",
      link: `/app/profile`,
    });

    res.json({ message: "Expert approved successfully" });
  } catch (error) {
    next(error);
  }
};
export const rejectExpert = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.profile.upsert({
      where: { userId: id },
      update: {
        expertApplicationStatus: "REJECTED",
      },
      create: {
        userId: id,
        expertise: [],
        expertApplicationStatus: "REJECTED",
      },
    });

    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Application Not Approved",
      body: "Your expert application was not approved at this time.",
      link: `/app/profile`,
    });

    res.json({ message: "Application rejected" });
  } catch (error) {
    next(error);
  }
};
export const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "ADMIN")
      return res.status(400).json({ message: "Cannot suspend an admin" });

    const updated = await prisma.user.update({
      where: { id },
      data: { isSuspended: true },
    });

    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Account suspended",
      body: "Your account has been suspended by an administrator.",
      link: "/app",
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const unsuspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updated = await prisma.user.update({
      where: { id },
      data: { isSuspended: false },
    });

    await createNotification({
      userId: id,
      type: "SYSTEM",
      title: "Account reactivated",
      body: "Your account has been reactivated. You can now log in.",
      link: "/app",
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
export const getevents = async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        organizer: { select: { name: true } },
        _count: { select: { registrations: true } },
      },
    });
    res.json(events);
  } catch (error) {
    next(error);
  }
};
export const getEventRegistrations = async (req, res, next) => {
  try {
    const registrations = await prisma.eventRegistration.findMany({
      where: { eventId: req.params.id },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { id: "desc" },
    });
    res.json(registrations);
  } catch (error) { next(error); }
};
export const getEventApplications = async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.organizerId !== userId && req.user.role !== "ADMIN")
      return res.status(403).json({ message: "Not allowed" });

    const applications = await prisma.eventApplication.findMany({
      where: { eventId },
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

export const updateEventApplicationStatus = async (req, res, next) => {
  try {
    const { id: eventId, appId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (event.organizerId !== userId && req.user.role !== "ADMIN")
      return res.status(403).json({ message: "Not allowed" });

    const app = await prisma.eventApplication.update({
      where: { id: appId },
      data: { status },
    });

    const price = event.price.toNumber();

    if (status === "ACCEPTED") {
      if (price === 0) {
        await prisma.eventRegistration.upsert({
          where: { eventId_userId: { eventId, userId: app.userId } },
          update: {},
          create: { eventId, userId: app.userId },
        });

        await createNotification({
          userId: app.userId,
          type: "EVENT",
          title: "Application Accepted! 🎉",
          body: `You've been accepted to "${event.title}". You're now registered!`,
          link: `/app/events/${eventId}`,
        });

        const user = await prisma.user.findUnique({
          where: { id: app.userId },
          select: { name: true, email: true },
        });

        if (user) {
          const eventDate = new Date(event.date).toLocaleDateString("en-US", {
            weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
          });
          const eventTime = new Date(event.date).toLocaleTimeString("en-US", {
            hour: "2-digit", minute: "2-digit", timeZone: "UTC",
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
                  <p style="color: #374151;">Your application was accepted and your spot is confirmed for:</p>
                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h2 style="color: #1f2937; margin: 0 0 12px 0;">${event.title}</h2>
                    <p style="margin: 6px 0; color: #6b7280;"><strong style="color: #374151;">Type:</strong> ${event.type.replace("_", " ")}</p>
                    <p style="margin: 6px 0; color: #6b7280;"><strong style="color: #374151;">Date:</strong> ${eventDate}</p>
                    <p style="margin: 6px 0; color: #6b7280;"><strong style="color: #374151;">Time:</strong> ${eventTime}</p>
                    <p style="margin: 6px 0; color: #6b7280;"><strong style="color: #374151;">Location:</strong> ${locationLine}</p>
                    <p style="margin: 6px 0; color: #6b7280;"><strong style="color: #374151;">Entry:</strong> Free</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">
                    Manage your registrations from your
                    <a href="${process.env.CLIENT_URL}/app/events/my" style="color: #2563eb;">My Events</a> page.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">© 360EVO — Innovation & Investment Platform</p>
                </div>
              </div>
            `,
          }).catch((err) => console.error("Free event confirmation email failed:", err));
        }

      } else {
        await createNotification({
          userId: app.userId,
          type: "EVENT",
          title: "Application Accepted! Complete Payment 💳",
          body: `Your application to "${event.title}" was accepted. Complete payment to secure your spot.`,
          link: `/app/events/${eventId}/pay`,
        });
      }
    } else if (status === "REJECTED") {
      await createNotification({
        userId: app.userId,
        type: "EVENT",
        title: "Application Update",
        body: `Your application to "${event.title}" was not accepted.`,
        link: "/app/events",
      });
    }

    res.json(app);
  } catch (error) {
    next(error);
  }
};