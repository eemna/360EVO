import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";
import { runProjectAssessment } from "../services/assessmentService.js";
import { sendEmail } from "../utils/email.js";
import crypto from "crypto";

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
      title: "Project approved!",
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
export const getStat = async (req, res, next) => {
  try {
    const [userCount, projectCount] = await prisma.$transaction([
      prisma.user.count(),
      prisma.project.count({ where: { status: "APPROVED" } }),
    ]);

    res.json({
      users: userCount,
      projects: projectCount,
    });
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
  } catch (error) {
    next(error);
  }
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
          }).catch((err) =>
            console.error("Free event confirmation email failed:", err),
          );
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

export const getGrowthAnalytics = async (req, res, next) => {
  try {
    const { range = "monthly", startDate, endDate } = req.query;

    const validRanges = { daily: "day", weekly: "week", monthly: "month" };
    const bucket = validRanges[range] || "month";

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 jours par défaut
    const end = endDate ? new Date(endDate) : new Date();

    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        date_trunc('${bucket}', "createdAt") AS period,
        role,
        COUNT(*)::int AS count
      FROM "User"
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
      GROUP BY period, role
      ORDER BY period ASC
      `,
      start,
      end,
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const getEngagementAnalytics = async (req, res, next) => {
  try {
    const { range = "monthly", startDate, endDate } = req.query;

    const validRanges = { daily: "day", weekly: "week", monthly: "month" };
    const bucket = validRanges[range] || "month";

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [projectsByStatus, matches, messages, dataRoomActivity, activeUsers] =
      await Promise.all([
        prisma.$queryRawUnsafe(
          `
          SELECT date_trunc('${bucket}', "createdAt") AS period, status, COUNT(*)::int AS count
          FROM "Project"
          WHERE "createdAt" >= $1 AND "createdAt" <= $2
          GROUP BY period, status
          ORDER BY period ASC
          `,
          start,
          end,
        ),
        prisma.$queryRawUnsafe(
          `
          SELECT date_trunc('${bucket}', "createdAt") AS period, COUNT(*)::int AS count
          FROM "Match"
          WHERE "createdAt" >= $1 AND "createdAt" <= $2
          GROUP BY period
          ORDER BY period ASC
          `,
          start,
          end,
        ),
        prisma.$queryRawUnsafe(
          `
          SELECT date_trunc('${bucket}', "createdAt") AS period, COUNT(*)::int AS count
          FROM "Message"
          WHERE "createdAt" >= $1 AND "createdAt" <= $2
          GROUP BY period
          ORDER BY period ASC
          `,
          start,
          end,
        ),
        prisma.$queryRawUnsafe(
          `
          SELECT date_trunc('${bucket}', "createdAt") AS period, COUNT(*)::int AS count
          FROM "DataRoomActivity"
          WHERE "createdAt" >= $1 AND "createdAt" <= $2
          GROUP BY period
          ORDER BY period ASC
          `,
          start,
          end,
        ),
        prisma.$queryRawUnsafe(
          `
          SELECT date_trunc('${bucket}', activity_date) AS period, COUNT(DISTINCT user_id)::int AS count
          FROM (
            SELECT "senderId" AS user_id, "createdAt" AS activity_date FROM "Message"
            WHERE "createdAt" >= $1 AND "createdAt" <= $2
            UNION ALL
            SELECT "ownerId" AS user_id, "createdAt" AS activity_date FROM "Project"
            WHERE "createdAt" >= $1 AND "createdAt" <= $2
            UNION ALL
            SELECT "userId" AS user_id, "createdAt" AS activity_date FROM "DataRoomActivity"
            WHERE "createdAt" >= $1 AND "createdAt" <= $2
          ) combined
          GROUP BY period
          ORDER BY period ASC
          `,
          start,
          end,
        ),
      ]);

    res.json({
      projectsByStatus,
      matches,
      messages,
      dataRoomActivity,
      activeUsers,
    });
  } catch (error) {
    next(error);
  }
};

export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { range = "monthly", startDate, endDate } = req.query;

    const validRanges = { daily: "day", weekly: "week", monthly: "month" };
    const bucket = validRanges[range] || "month";

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const rows = await prisma.$queryRawUnsafe(
      `
      SELECT
        date_trunc('${bucket}', "createdAt") AS period,
        "referenceType",
        SUM(amount)::float AS total,
        COUNT(*)::int AS count
      FROM "Payment"
      WHERE "createdAt" >= $1 AND "createdAt" <= $2 AND status = 'SUCCEEDED'
      GROUP BY period, "referenceType"
      ORDER BY period ASC
      `,
      start,
      end,
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
};

export const getEventProgramAnalytics = async (req, res, next) => {
  try {
    const { range = "monthly", startDate, endDate } = req.query;

    const validRanges = { daily: "day", weekly: "week", monthly: "month" };
    const bucket = validRanges[range] || "month";

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [eventRegistrations, eventApplications, programApplications] =
      await Promise.all([
        prisma.$queryRawUnsafe(
          `
          SELECT
            date_trunc('${bucket}', "createdAt") AS period,
            COUNT(*)::int AS registrations
          FROM "EventRegistration"
          WHERE "createdAt" >= $1 AND "createdAt" <= $2
          GROUP BY period
          ORDER BY period ASC
          `,
          start,
          end,
        ),
        prisma.$queryRawUnsafe(
          `
          SELECT
            date_trunc('${bucket}', "createdAt") AS period,
            status,
            COUNT(*)::int AS count
          FROM "EventApplication"
          WHERE "createdAt" >= $1 AND "createdAt" <= $2
          GROUP BY period, status
          ORDER BY period ASC
          `,
          start,
          end,
        ),
        prisma.$queryRawUnsafe(
          `
          SELECT
            date_trunc('${bucket}', "submittedAt") AS period,
            status,
            COUNT(*)::int AS count
          FROM "ProgramApplication"
          WHERE "submittedAt" >= $1 AND "submittedAt" <= $2
          GROUP BY period, status
          ORDER BY period ASC
          `,
          start,
          end,
        ),
      ]);

const eventFillRates = await prisma.$queryRaw`
  SELECT
    e.id,
    e.title,
    e.capacity,
    COUNT(DISTINCT er.id)::int AS registrations,
    CASE
      WHEN e.capacity > 0
        THEN ROUND((COUNT(DISTINCT er.id)::numeric / e.capacity) * 100, 2)
      ELSE 0
    END AS "fillRate"
  FROM "Event" e
  LEFT JOIN "EventRegistration" er ON er."eventId" = e.id
  WHERE e.capacity IS NOT NULL
  GROUP BY e.id, e.title, e.capacity
  ORDER BY e.date DESC
  LIMIT 50
`;

const programFillRates = await prisma.$queryRaw`
  SELECT
    p.id,
    p.title,
    p.capacity,
    COUNT(DISTINCT pp.id)::int AS participants,
    COUNT(DISTINCT pa.id)::int AS applications,
    CASE
      WHEN p.capacity > 0
        THEN ROUND((COUNT(DISTINCT pp.id)::numeric / p.capacity) * 100, 2)
      ELSE 0
    END AS "fillRate"
  FROM "Program" p
  LEFT JOIN "ProgramParticipant" pp ON pp."programId" = p.id
  LEFT JOIN "ProgramApplication" pa ON pa."programId" = p.id
  WHERE p.capacity IS NOT NULL
  GROUP BY p.id, p.title, p.capacity
  ORDER BY p."createdAt" DESC
  LIMIT 50
`;

    res.json({
      eventRegistrations,
      eventApplications,
      programApplications,
      eventFillRates,
      programFillRates,
    });
  } catch (error) {
    next(error);
  }
};


export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "ADMIN") {
      return res.status(400).json({ message: "Demote this admin before deleting" });
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};

export const inviteAdmin = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      const updated = await prisma.user.update({
        where: { email },
        data: { role: "ADMIN" },
      });
      await createNotification({
        userId: updated.id,
        type: "SYSTEM",
        title: "You've been made an admin",
        body: "An administrator granted you admin access to 360EVO.",
        link: "/app/admin",
      });
      return res.json({ message: "Existing user promoted to admin" });
    }

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    await prisma.adminInvite.deleteMany({ where: { email } });

    await prisma.adminInvite.create({
      data: {
        email,
        token: inviteToken,
        expiresAt,
        invitedBy: req.user.id,
      },
    });

    const inviteLink = `${process.env.CLIENT_URL}/register?inviteToken=${inviteToken}&email=${encodeURIComponent(email)}`;

    await sendEmail({
      to: email,
      subject: "You've been invited as an admin on 360EVO",
      html: `
        <p>You've been invited to join 360EVO as an administrator.</p>
        <p>Click below to create your account — you'll be granted admin access automatically:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>This invite link expires in 7 days.</p>
      `,
    });

    res.json({ message: "Invite email sent" });
  } catch (error) {
    next(error);
  }
};