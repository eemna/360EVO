import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";

jest.unstable_mockModule("../utils/email.js", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

jest.unstable_mockModule("../services/assessmentService.js", () => ({
  runProjectAssessment: jest.fn().mockResolvedValue(true),
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../server.js");
const { prisma } = await import("../config/prisma.js");

async function createAndLoginUser({
  name = "Test User",
  role = "STARTUP",
  companyName = null,
} = {}) {
  const email = `user_${Date.now()}_${Math.random().toString(36).slice(2)}@example.com`;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: "hashed-password",
      role,
      isVerified: true,
      profile: {
        create: {
          ...(companyName && { companyName }),
        },
      },
    },
  });

  const accessToken = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return { accessToken, userId: user.id, email };
}

describe("Project Lifecycle — create → submit → approve → gallery", () => {
  let startupToken, startupUserId, startupEmail;
  let adminToken, adminUserId, adminEmail;
  let otherToken, otherUserId;
  let projectId;

  const baseProject = {
    title: "AI-Powered Supply Chain",
    tagline: "Optimize logistics with AI",
    shortDesc: "A short description of the project that is meaningful.",
    fullDesc:
      "A much longer description explaining the full scope of the project and its impact.",
    industry: "Technology",
    stage: "MVP",
    fundingSought: 500000,
    currency: "USD",
    location: "Tunis, Tunisia",
  };

  beforeAll(async () => {
    ({
      accessToken: startupToken,
      userId: startupUserId,
      email: startupEmail,
    } = await createAndLoginUser({
      role: "STARTUP",
      companyName: "Supply Chain AI",
    }));

    const { userId: memberId, email: mEmail } = await createAndLoginUser({
      role: "MEMBER",
    });
    adminUserId = memberId;
    adminEmail = mEmail;

    await prisma.user.update({
      where: { id: memberId },
      data: { role: "ADMIN" },
    });

    adminToken = jwt.sign(
      { id: memberId, role: "ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    ({ accessToken: otherToken, userId: otherUserId } =
      await createAndLoginUser({
        role: "STARTUP",
        companyName: "Other Corp",
      }));
  }, 30000);

  afterAll(async () => {
    const userIds = [startupUserId, adminUserId, otherUserId].filter(Boolean);
    if (userIds.length) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    }
    await prisma.$disconnect();
  });

  test("1 — startup can create a project → status DRAFT", async () => {
    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${startupToken}`)
      .send(baseProject);

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe(baseProject.title);
    expect(res.body.status).toBe("DRAFT");
    expect(res.body.ownerId).toBe(startupUserId);

    projectId = res.body.id;
    expect(projectId).toBeDefined();
  });

  test("2 — unauthenticated POST /api/projects is rejected with 401", async () => {
    const res = await request(app).post("/api/projects").send(baseProject);
    expect(res.statusCode).toBe(401);
  });

  test("3 — owner can read their own DRAFT project", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${startupToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(projectId);
    expect(res.body.status).toBe("DRAFT");
  });

  test("4 — owner can update the DRAFT project", async () => {
    const res = await request(app)
      .put(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${startupToken}`)
      .send({ tagline: "Updated tagline v2" });

    expect(res.statusCode).toBe(200);
    expect(res.body.tagline).toBe("Updated tagline v2");
  });

  test("5 — DRAFT appears in GET /api/projects/mine", async () => {
    const res = await request(app)
      .get("/api/projects/mine")
      .set("Authorization", `Bearer ${startupToken}`);

    expect(res.statusCode).toBe(200);
    const ids = res.body.map((p) => p.id);
    expect(ids).toContain(projectId);
  });

  test("6 — owner submits the project → status PENDING", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/submit`)
      .set("Authorization", `Bearer ${startupToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("PENDING");
  });

  test("7 — a different user cannot submit someone else's project", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/submit`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.statusCode).toBe(403);
  });

  test("8 — PENDING project cannot be deleted", async () => {
    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${startupToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/draft|rejected/i);
  });

  test("9 — admin can approve the project → status APPROVED", async () => {
    const res = await request(app)
      .patch(`/api/admin/projects/${projectId}/approve`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("APPROVED");
  });

  test("10 — non-admin cannot call the admin approve endpoint", async () => {
    const res = await request(app)
      .patch(`/api/admin/projects/${projectId}/approve`)
      .set("Authorization", `Bearer ${startupToken}`);

    expect([401, 403]).toContain(res.statusCode);
  });

  test("11 — approved PUBLIC project appears in the public gallery", async () => {
    const res = await request(app).get("/api/projects?page=1&limit=50");

    expect(res.statusCode).toBe(200);
    const ids = res.body.map((p) => p.id);
    expect(ids).toContain(projectId);
  });

  test("12 — public gallery only exposes APPROVED projects", async () => {
    const res = await request(app).get("/api/projects");

    expect(res.statusCode).toBe(200);
    expect(res.body.every((p) => p.status === "APPROVED")).toBe(true);
  });

  test("13 — full-text search finds the project by keyword", async () => {
    const res = await request(app).get("/api/projects?q=Supply+Chain");

    expect(res.statusCode).toBe(200);
    const ids = res.body.map((p) => p.id);
    expect(ids).toContain(projectId);
  });

  test("14 — GET /api/projects/featured returns an array", async () => {
    const res = await request(app).get("/api/projects/featured");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test("15 — owner can post an update on an approved project", async () => {
    const res = await request(app)
      .post(`/api/projects/${projectId}/updates`)
      .set("Authorization", `Bearer ${startupToken}`)
      .send({ content: "We just closed our seed round!" });

    expect(res.statusCode).toBe(201);
    expect(res.body.content).toBe("We just closed our seed round!");
  });

  test("16 — authenticated user can read project updates", async () => {
    const res = await request(app)
      .get(`/api/projects/${projectId}/updates`)
      .set("Authorization", `Bearer ${startupToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0].content).toBe("We just closed our seed round!");
  });

  test("17 — unauthenticated GET /api/projects/:id/updates is rejected", async () => {
    const res = await request(app).get(`/api/projects/${projectId}/updates`);
    expect(res.statusCode).toBe(401);
  });

  test("18 — admin can reject a pending project; owner can then delete it", async () => {
    const createRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${startupToken}`)
      .send({ ...baseProject, title: "Project To Reject" });
    expect(createRes.statusCode).toBe(201);
    const pid = createRes.body.id;

    const submitRes = await request(app)
      .post(`/api/projects/${pid}/submit`)
      .set("Authorization", `Bearer ${startupToken}`);
    expect(submitRes.statusCode).toBe(200);

    const rejectRes = await request(app)
      .patch(`/api/admin/projects/${pid}/reject`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(rejectRes.statusCode).toBe(200);
    expect(rejectRes.body.status).toBe("REJECTED");

    const deleteRes = await request(app)
      .delete(`/api/projects/${pid}`)
      .set("Authorization", `Bearer ${startupToken}`);
    expect(deleteRes.statusCode).toBe(200);
    expect(deleteRes.body.message).toMatch(/deleted/i);
  });

  test("19 — startup dashboard returns correct shape and counts", async () => {
    const res = await request(app)
      .get("/api/projects/dashboard")
      .set("Authorization", `Bearer ${startupToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.stats).toBeDefined();
    expect(typeof res.body.stats.totalProjects).toBe("number");
    expect(res.body.stats.totalProjects).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.projects)).toBe(true);
  });

  test("20 — unauthenticated GET /api/projects/dashboard is rejected", async () => {
    const res = await request(app).get("/api/projects/dashboard");
    expect(res.statusCode).toBe(401);
  });
});
