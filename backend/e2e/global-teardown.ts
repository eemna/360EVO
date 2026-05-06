import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../frontend/.env.e2e") });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.E2E_DATABASE_URL } },
});

export default async function globalTeardown() {
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
  await prisma.$disconnect();
  console.log("E2E DB cleaned up");
}