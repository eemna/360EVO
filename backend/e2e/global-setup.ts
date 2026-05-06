import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../frontend/.env.e2e") });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.E2E_DATABASE_URL } },
});

export default async function globalSetup() {
  let retries = 5;
  while (retries > 0) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      console.log("E2E DB is awake");
      break;
    } catch {
      console.log(`Waiting for E2E DB... (${retries} retries left)`);
      await new Promise((r) => setTimeout(r, 3000));
      retries--;
    }
  }

  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, "../../backend"),
    env: {
      ...process.env,
      DATABASE_URL: process.env.E2E_DATABASE_URL!,
      DIRECT_URL: process.env.E2E_DIRECT_URL!,
    },
    stdio: "inherit",
  });

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

  const hashedPassword = await bcrypt.hash("AdminPass123!", 12);
  const admin = await prisma.user.create({
    data: {
      name: "E2E Admin",
      email: "e2e-admin@test.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
      isVerified: true,
      profile: { create: {} },
    },
  });

  console.log(`Admin seeded: ${admin.email}`);
  await prisma.$disconnect();
}
