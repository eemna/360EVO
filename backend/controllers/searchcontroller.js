import { prisma } from "../config/prisma.js";

function highlight(text, q) {
  if (!text || !q) return text ?? "";
  const words = q
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (!words.length) return text;
  const pattern = new RegExp(`(${words.join("|")})`, "gi");
  return text.replace(pattern, "<mark>$1</mark>");
}

function snippet(text, maxLen = 160) {
  if (!text) return "";
  const plain = text.replace(/<[^>]*>/g, "");
  return plain.length > maxLen ? plain.slice(0, maxLen) + "…" : plain;
}

export const globalSearch = async (req, res, next) => {
  try {
    const { q = "", type = "all", page = 1, limit = 10 } = req.query;

    const trimmed = q.toString().trim();

    if (trimmed.length < 2) {
      return res.json({
        q: trimmed,
        type,
        results: {
          projects: [],
          users: [],
          experts: [],
          events: [],
          programs: [],
        },
        pagination: { page: 1, limit: Number(limit), totals: {} },
      });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const fetchAll = type === "all";
    const shouldFetch = (t) => fetchAll || type === t;

    const [projectRows, userRows, expertRows, eventRows, programRows] =
      await Promise.all([
        shouldFetch("projects")
          ? prisma.$queryRaw`
            SELECT
              p.id,
              p.title,
              p.tagline,
              p."shortDesc"   AS description,
              p.stage,
              p.industry,
              p.status,
              p."createdAt",
              u.name          AS "ownerName",
              ts_rank(p.search_vector, plainto_tsquery('english', ${trimmed})) AS rank,
              COUNT(*) OVER() AS total
            FROM "Project" p
            LEFT JOIN "User" u ON u.id = p."ownerId"
            WHERE
              p.status    = 'APPROVED'
              AND p.visibility = 'PUBLIC'
              AND p.search_vector @@ plainto_tsquery('english', ${trimmed})
            ORDER BY rank DESC
            LIMIT ${take} OFFSET ${skip}
          `
          : Promise.resolve([]),

        shouldFetch("users")
          ? prisma.$queryRaw`
            SELECT
              u.id,
              u.name,
              u.role,
              u.email,
              p.bio,
              p.avatar,
              p.location,
              ts_rank(u.search_vector, plainto_tsquery('english', ${trimmed})) AS rank,
              COUNT(*) OVER() AS total
            FROM "User" u
            LEFT JOIN "Profile" p ON p."userId" = u.id
            WHERE
              u.search_vector @@ plainto_tsquery('english', ${trimmed})
              AND u."isSuspended" = false
            ORDER BY rank DESC
            LIMIT ${take} OFFSET ${skip}
          `
          : Promise.resolve([]),

        shouldFetch("experts")
          ? prisma.$queryRaw`
            SELECT
              u.id,
              u.name,
              u.role,
              p.bio,
              p.avatar,
              p.expertise,
              p.industries,
              p."hourlyRate",
              p."avgRating",
              p."reviewCount",
              p."availabilityStatus",
              ts_rank(u.search_vector, plainto_tsquery('english', ${trimmed})) AS rank,
              COUNT(*) OVER() AS total
            FROM "User" u
            LEFT JOIN "Profile" p ON p."userId" = u.id
            WHERE
              u.role = 'EXPERT'
              AND u."isSuspended" = false
              AND u.search_vector @@ plainto_tsquery('english', ${trimmed})
            ORDER BY rank DESC
            LIMIT ${take} OFFSET ${skip}
          `
          : Promise.resolve([]),

        shouldFetch("events")
          ? prisma.$queryRaw`
            SELECT
              e.id,
              e.title,
              e.description,
              e.type,
              e.date,
              e."endDate",
              e.location,
              e."virtualLink",
              e.price,
              e.capacity,
              e."coverImage",
              u.name AS "organizerName",
              ts_rank(e.search_vector, plainto_tsquery('english', ${trimmed})) AS rank,
              COUNT(*) OVER() AS total
            FROM "Event" e
            LEFT JOIN "User" u ON u.id = e."organizerId"
            WHERE
              e.status = 'PUBLISHED'
              AND e.search_vector @@ plainto_tsquery('english', ${trimmed})
            ORDER BY rank DESC
            LIMIT ${take} OFFSET ${skip}
          `
          : Promise.resolve([]),

        shouldFetch("programs")
          ? prisma.$queryRaw`
            SELECT
              p.id,
              p.title,
              p.description,
              p.type,
              p.status,
              p."startDate",
              p."applicationDeadline",
              p.capacity,
              p.price,
              p."coverImage",
              u.name AS "organizerName",
              ts_rank(p.search_vector, plainto_tsquery('english', ${trimmed})) AS rank,
              COUNT(*) OVER() AS total
            FROM "Program" p
            LEFT JOIN "User" u ON u.id = p."organizerId"
            WHERE
              p.status = 'OPEN'
              AND p.search_vector @@ plainto_tsquery('english', ${trimmed})
            ORDER BY rank DESC
            LIMIT ${take} OFFSET ${skip}
          `
          : Promise.resolve([]),
      ]);

    const projects = projectRows.map((r) => ({
      id: r.id,
      type: "project",
      title: highlight(r.title, trimmed),
      snippet: highlight(snippet(r.description), trimmed),
      meta: { stage: r.stage, industry: r.industry, owner: r.ownerName },
      url: `/app/startup/projects/${r.id}`,
      rank: Number(r.rank),
    }));

    const users = userRows.map((r) => ({
      id: r.id,
      type: "user",
      title: highlight(r.name, trimmed),
      snippet: highlight(snippet(r.bio), trimmed),
      meta: { role: r.role, location: r.location, avatar: r.avatar },
      url: `/app/profile/${r.id}`,
      rank: Number(r.rank),
    }));

    const experts = expertRows.map((r) => ({
      id: r.id,
      type: "expert",
      title: highlight(r.name, trimmed),
      snippet: highlight(snippet(r.bio), trimmed),
      meta: {
        expertise: r.expertise,
        hourlyRate: r.hourlyRate ? Number(r.hourlyRate) : null,
        avgRating: r.avgRating ? Number(r.avgRating) : null,
        availability: r.availabilityStatus,
        avatar: r.avatar,
      },
      url: `/app/profile/${r.id}`,
      rank: Number(r.rank),
    }));

    const events = eventRows.map((r) => ({
      id: r.id,
      type: "event",
      title: highlight(r.title, trimmed),
      snippet: highlight(snippet(r.description), trimmed),
      meta: {
        eventType: r.type,
        date: r.date,
        location: r.location || (r.virtualLink ? "Online" : "TBD"),
        price: Number(r.price ?? 0),
        organizer: r.organizerName,
      },
      url: `/app/events/${r.id}`,
      rank: Number(r.rank),
    }));

    const programs = programRows.map((r) => ({
      id: r.id,
      type: "program",
      title: highlight(r.title, trimmed),
      snippet: highlight(snippet(r.description), trimmed),
      meta: {
        programType: r.type,
        deadline: r.applicationDeadline,
        price: Number(r.price ?? 0),
        organizer: r.organizerName,
      },
      url: `/app/programs/${r.id}`,
      rank: Number(r.rank),
    }));

    const totals = {
      projects: projectRows[0] ? Number(projectRows[0].total) : 0,
      users: userRows[0] ? Number(userRows[0].total) : 0,
      experts: expertRows[0] ? Number(expertRows[0].total) : 0,
      events: eventRows[0] ? Number(eventRows[0].total) : 0,
      programs: programRows[0] ? Number(programRows[0].total) : 0,
    };

    totals.all =
      totals.projects +
      totals.users +
      totals.experts +
      totals.events +
      totals.programs;

    return res.json({
      q: trimmed,
      type,
      results: { projects, users, experts, events, programs },
      pagination: {
        page: Number(page),
        limit: take,
        totals,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const autocomplete = async (req, res, next) => {
  try {
    const { q = "" } = req.query;
    const trimmed = q.toString().trim();

    if (trimmed.length < 2) {
      return res.json({ q: trimmed, suggestions: [] });
    }

    const prefixQuery = trimmed
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => `${w}:*`)
      .join(" & ");

    const [projects, users, experts, events, programs] = await Promise.all([
      prisma.$queryRaw`
        SELECT id, title, 'project' AS type, stage AS meta
        FROM "Project"
        WHERE status = 'APPROVED' AND visibility = 'PUBLIC'
          AND search_vector @@ to_tsquery('english', ${prefixQuery})
        ORDER BY ts_rank(search_vector, to_tsquery('english', ${prefixQuery})) DESC
        LIMIT 3
      `,
      prisma.$queryRaw`
        SELECT u.id, u.name AS title, 'user' AS type, u.role AS meta
        FROM "User" u
        WHERE u.role NOT IN ('EXPERT','ADMIN')
          AND u."isSuspended" = false
          AND u.search_vector @@ to_tsquery('english', ${prefixQuery})
        ORDER BY ts_rank(u.search_vector, to_tsquery('english', ${prefixQuery})) DESC
        LIMIT 3
      `,
      prisma.$queryRaw`
        SELECT u.id, u.name AS title, 'expert' AS type, u.role AS meta
        FROM "User" u
        WHERE u.role = 'EXPERT'
          AND u."isSuspended" = false
          AND u.search_vector @@ to_tsquery('english', ${prefixQuery})
        ORDER BY ts_rank(u.search_vector, to_tsquery('english', ${prefixQuery})) DESC
        LIMIT 3
      `,
      prisma.$queryRaw`
        SELECT id, title, 'event' AS type, type AS meta
        FROM "Event"
        WHERE status = 'PUBLISHED'
          AND search_vector @@ to_tsquery('english', ${prefixQuery})
        ORDER BY ts_rank(search_vector, to_tsquery('english', ${prefixQuery})) DESC
        LIMIT 3
      `,
      prisma.$queryRaw`
        SELECT id, title, 'program' AS type, type AS meta
        FROM "Program"
        WHERE status = 'OPEN'
          AND search_vector @@ to_tsquery('english', ${prefixQuery})
        ORDER BY ts_rank(search_vector, to_tsquery('english', ${prefixQuery})) DESC
        LIMIT 3
      `,
    ]);

    const suggestions = [
      ...projects.map((r) => ({ ...r, label: r.title, category: "Projects" })),
      ...users.map((r) => ({ ...r, label: r.title, category: "People" })),
      ...experts.map((r) => ({ ...r, label: r.title, category: "Experts" })),
      ...events.map((r) => ({ ...r, label: r.title, category: "Events" })),
      ...programs.map((r) => ({ ...r, label: r.title, category: "Programs" })),
    ];

    return res.json({ q: trimmed, suggestions });
  } catch (error) {
    next(error);
  }
};
