import { jest } from "@jest/globals";
import crypto from "crypto";

jest.unstable_mockModule("../utils/email.js", () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
}));

const request = (await import("supertest")).default;
const { default: app } = await import("../server.js");
const { prisma } = await import("../config/prisma.js");

async function clearDatabase() {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "DataRoomActivity", "AiDealBrief", "DdQaResponse", "DdQaThread",
      "DataRoomDocument", "DataRoom", "DdRequest", "Review", "Booking",
      "LlmInsight", "Match", "AiAssessment", "ProjectAnalytics",
      "ProgramParticipant", "ProgramApplication", "Payment",
      "EventApplication", "EventRegistration", "Message", "Notification",
      "Bookmark", "ProjectInterest", "ProjectUpdate", "ProjectDocument",
      "Milestone", "TeamMember", "WeeklyAvailability",
      "ConversationParticipant", "Conversation", "InvestorProfile",
      "Program", "Event", "Project", "PasswordReset", "RefreshToken",
      "EmailVerification", "Profile", "User"
    CASCADE
  `);
}

afterEach(async () => await clearDatabase());

afterAll(async () => {
  await clearDatabase();
  await prisma.$disconnect();
});

describe("Auth Flow — register → verify → login → reset", () => {
  const testEmail = `authtest_${Date.now()}@example.com`;
  const testPassword = "TestPass123!";
  const testUser = {
    name: "Auth Test User",
    email: testEmail,
    password: testPassword,
    role: "MEMBER",
  };

  test("1 — registers a new user", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toContain("Registration successful");
  });

  test("2 — blocks duplicate registration", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app).post("/api/auth/register").send(testUser);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toContain("already exists");
  });

  test("3 — blocks login before email verified", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toContain("verify your email");
  });

  test("4 — verifies email with token from DB", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const record = await prisma.emailVerification.findFirst({
      where: { user: { email: testEmail } },
    });
    expect(record).not.toBeNull();

    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ token: record.token });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("verified");
  });

  test("5 — logs in after verification", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const record = await prisma.emailVerification.findFirst({
      where: { user: { email: testEmail } },
    });
    await request(app)
      .post("/api/auth/verify-email")
      .send({ token: record.token });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
  });

  test("6 — rejects wrong password", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const record = await prisma.emailVerification.findFirst({
      where: { user: { email: testEmail } },
    });
    await request(app)
      .post("/api/auth/verify-email")
      .send({ token: record.token });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "WrongPassword!" });

    expect(res.statusCode).toBe(401);
  });

  test("7 — forgot password returns success message", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const record = await prisma.emailVerification.findFirst({
      where: { user: { email: testEmail } },
    });
    await request(app)
      .post("/api/auth/verify-email")
      .send({ token: record.token });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testEmail });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("reset link");
  });

  test("8 — resets password with injected token", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const record = await prisma.emailVerification.findFirst({
      where: { user: { email: testEmail } },
    });
    await request(app)
      .post("/api/auth/verify-email")
      .send({ token: record.token });

    const rawToken = "known-test-reset-token-abc123";
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
      create: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, newPassword: "NewSecurePass456!" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toContain("Password reset successful");
  });

  test("9 — logs in with new password", async () => {
    await request(app).post("/api/auth/register").send(testUser);

    const record = await prisma.emailVerification.findFirst({
      where: { user: { email: testEmail } },
    });
    await request(app)
      .post("/api/auth/verify-email")
      .send({ token: record.token });

    const rawToken = "known-test-reset-token-abc123";
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const user = await prisma.user.findUnique({
      where: { email: testEmail },
    });

    await prisma.passwordReset.upsert({
      where: { userId: user.id },
      update: {
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
      create: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3_600_000),
      },
    });

    await request(app)
      .post("/api/auth/reset-password")
      .send({ token: rawToken, newPassword: "NewSecurePass456!" });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "NewSecurePass456!" });

    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });
});
