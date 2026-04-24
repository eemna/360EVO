import { prisma } from "../config/prisma.js";
import { createNotification } from "../utils/createNotification.js";
import { sendEmail } from "../utils/email.js";

export const getPrograms = async (req, res, next) => {
  try {
    const { type, status = "OPEN", search, page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    if (!search?.toString().trim()) {
      const where = {
        ...(status && { status }),
        ...(type && { type }),
        ...(status === "OPEN" && { applicationDeadline: { gte: new Date() } }),
      };

      const [programs, total] = await prisma.$transaction([
        prisma.program.findMany({
          where,
          include: {
            organizer: { select: { name: true } },
            _count: { select: { applications: true, participants: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take,
        }),
        prisma.program.count({ where }),
      ]);

      return res.json({
        data: programs,
        pagination: {
          total,
          page: Number(page),
          limit: take,
          totalPages: Math.ceil(total / take),
          hasNextPage: skip + take < total,
          hasPrevPage: Number(page) > 1,
        },
      });
    }

    const tsQuery = search
      .toString()
      .trim()
      .split(/\s+/)
      .map((word) => `${word}:*`)
      .join(" & ");

    const programs = await prisma.$queryRaw`
      SELECT
        p.id,
        p.title,
        p.description,
        p.type,
        p.status,
        p."startDate",
        p."endDate",
        p."applicationDeadline",
        p.capacity,
        p.benefits,
        p.requirements,
        p."organizerId",
        p."coverImage",
        p."createdAt",
        json_build_object('name', u.name) AS organizer,
        json_build_object(
          'applications', COUNT(DISTINCT pa.id)::int,
          'participants', COUNT(DISTINCT pp.id)::int
        ) AS "_count"
      FROM "Program" p
      LEFT JOIN "User" u ON u.id = p."organizerId"
      LEFT JOIN "ProgramApplication" pa ON pa."programId" = p.id
      LEFT JOIN "ProgramParticipant" pp ON pp."programId" = p.id
      WHERE p.search_vector @@ to_tsquery('english', ${tsQuery})
      GROUP BY p.id, u.name
      ORDER BY ts_rank(p.search_vector, to_tsquery('english', ${tsQuery})) DESC
      LIMIT ${take} OFFSET ${skip}
    `;

    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM "Program" p
      WHERE p.search_vector @@ to_tsquery('english', ${tsQuery})
    `;

    const total = countResult[0]?.total ?? 0;

    return res.json({
      data: programs,
      pagination: {
        total,
        page: Number(page),
        limit: take,
        totalPages: Math.ceil(total / take),
        hasNextPage: skip + take < total,
        hasPrevPage: Number(page) > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProgramById = async (req, res, next) => {
  try {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id },
      include: {
        organizer: { select: { name: true } },
        _count: { select: { applications: true, participants: true } },
      },
    });
    if (!program) return res.status(404).json({ message: "Program not found" });
    res.json(program);
  } catch (error) {
    next(error);
  }
};

export const createProgram = async (req, res, next) => {
  try {
    const { startDate, endDate, applicationDeadline, ...rest } = req.body;

    const program = await prisma.program.create({
      data: {
        ...rest,
        price: rest.price ? Number(rest.price) : 0,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applicationDeadline: new Date(applicationDeadline),
        organizerId: req.user.id,
      },
    });
    res.status(201).json(program);
  } catch (error) {
    next(error);
  }
};

export const updateProgram = async (req, res, next) => {
  try {
    const { startDate, endDate, applicationDeadline, ...rest } = req.body;

    const program = await prisma.program.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(applicationDeadline && {
          applicationDeadline: new Date(applicationDeadline),
        }),
      },
    });
    res.json(program);
  } catch (error) {
    next(error);
  }
};

export const applyToProgram = async (req, res, next) => {
  try {
    const { id: programId } = req.params;
    const userId = req.user.id;
    const { responses, projectId } = req.body;

    const program = await prisma.program.findUnique({
      where: { id: programId },
    });
    if (!program) return res.status(404).json({ message: "Program not found" });
    if (program.status !== "OPEN")
      return res
        .status(400)
        .json({ message: "Program is not accepting applications" });
    if (new Date() > program.applicationDeadline)
      return res
        .status(400)
        .json({ message: "Application deadline has passed" });

    const application = await prisma.programApplication.create({
      data: {
        programId,
        userId,
        responses: responses || {},
        projectId: projectId || null,
      },
    });

    await createNotification({
      userId: program.organizerId,
      type: "SYSTEM",
      title: "New Program Application",
      body: `A new application was submitted for "${program.title}"`,
      link: `/app/admin`,
    });

    res.status(201).json(application);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(400)
        .json({ message: "You already applied to this program" });
    }
    next(error);
  }
};

export const getMyApplications = async (req, res, next) => {
  try {
    const applications = await prisma.programApplication.findMany({
      where: { userId: req.user.id },
      include: {
        program: {
          include: {
            organizer: { select: { name: true } },
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

export const updateApplicationStatus = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const { status } = req.body;

    const app = await prisma.programApplication.update({
      where: { id: appId },
      data: { status },
      include: { program: true },
    });

    if (status === "ACCEPTED") {
      const price = app.program.price.toNumber();

      if (price === 0) {
        await prisma.programParticipant.upsert({
          where: { programId_userId: { programId: app.programId, userId: app.userId } },
          update: {},
          create: { programId: app.programId, userId: app.userId },
        });

        await createNotification({
          userId: app.userId,
          type: "SYSTEM",
          title: "Application Accepted! 🎉",
          body: `You've been accepted to "${app.program.title}". You're now enrolled!`,
          link: `/app/programs/${app.programId}`,
        });

        const user = await prisma.user.findUnique({
          where: { id: app.userId },
          select: { name: true, email: true },
        });

        if (user) {
          sendEmail({
            to: user.email,
            subject: `Enrollment Confirmed — ${app.program.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px; border-radius: 12px 12px 0 0;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">You're enrolled! 🎉</h1>
                </div>
                <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
                  <p style="color: #374151; font-size: 16px;">Hi <strong>${user.name}</strong>,</p>
                  <p style="color: #374151;">Your application was accepted and you're now enrolled in:</p>
                  <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h2 style="color: #1f2937; margin: 0 0 12px 0;">${app.program.title}</h2>
                    <p style="margin: 6px 0; color: #6b7280;"><strong style="color: #374151;">Type:</strong> ${app.program.type}</p>
                    <p style="margin: 6px 0; color: #6b7280;">
                      <strong style="color: #374151;">Starts:</strong>
                      ${new Date(app.program.startDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                    </p>
                    <p style="margin: 6px 0; color: #6b7280;"><strong style="color: #374151;">Fee:</strong> Free</p>
                  </div>
                  <p style="color: #6b7280; font-size: 14px;">
                    View your programs from your
                    <a href="${process.env.CLIENT_URL}/app/programs/my-applications" style="color: #4f46e5;">My Applications</a> page.
                  </p>
                  <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">© 360EVO — Innovation & Investment Platform</p>
                </div>
              </div>
            `,
          }).catch((err) => console.error("Free program enrollment email failed:", err));
        }

      } else {
        await createNotification({
          userId: app.userId,
          type: "SYSTEM",
          title: "Application Accepted! Complete Payment 💳",
          body: `Your application to "${app.program.title}" was accepted. Click here to complete your payment and secure your spot.`,
          link: `/app/programs/${app.programId}/pay`,
        });
      }

    } else if (status === "REJECTED") {
      await prisma.programParticipant.deleteMany({
        where: { programId: app.programId, userId: app.userId },
      });
      await createNotification({
        userId: app.userId,
        type: "SYSTEM",
        title: "Application Update",
        body: `Your application to "${app.program.title}" was not accepted this time.`,
        link: "/app/programs/my-applications",
      });
    }

    res.json(app);
  } catch (error) {
    next(error);
  }
};

export const getProgramApplications = async (req, res, next) => {
  try {
    const applications = await prisma.programApplication.findMany({
      where: { programId: req.params.id },
      include: {
        user: { select: { name: true, email: true, profile: true } },
        project: { select: { title: true, stage: true } },
      },
      orderBy: { submittedAt: "desc" },
    });
    res.json(applications);
  } catch (error) {
    next(error);
  }
};

export const getAdminStats = async (req, res, next) => {
  try {
    const [userCount, projectCount, eventCount, programCount, revenueData] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.project.count({ where: { status: "APPROVED" } }),
        prisma.event.count({ where: { status: "PUBLISHED" } }),
        prisma.program.count(),
        prisma.payment.groupBy({
          by: ["referenceType"],
          where: { status: "SUCCEEDED" },
          _sum: { amount: true },
        }),
      ]);

    const revenueByType = {};
    revenueData.forEach((r) => {
      revenueByType[r.referenceType] = Number(r._sum.amount || 0);
    });

    res.json({
      users: userCount,
      projects: projectCount,
      events: eventCount,
      programs: programCount,
      revenue: revenueByType,
      totalRevenue: Object.values(revenueByType).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPrograms = async (req, res, next) => {
  try {
    const programs = await prisma.program.findMany({
      include: {
        organizer: { select: { name: true } },
        _count: { select: { applications: true, participants: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(programs);
  } catch (error) {
    next(error);
  }
};

export const getRevenueReport = async (req, res, next) => {
  try {
    const revenue = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', p."createdAt") as month,
        SUM(p.amount)::float as total,
        COUNT(*)::int as count,
        p."referenceType",
        u.name as "userName",
        u.role as "userRole"
      FROM "Payment" p
      JOIN "User" u ON u.id = p."userId"
      WHERE p.status = 'SUCCEEDED'
      GROUP BY DATE_TRUNC('month', p."createdAt"), p."referenceType", u.id, u.name, u.role
      ORDER BY month DESC
      LIMIT 50
    `;
    res.json(revenue);
  } catch (error) {
    next(error);
  }
};
