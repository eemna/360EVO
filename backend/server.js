import { createServer } from "http";
import { Server } from "socket.io";
import { initializeSocket } from "./sockets/socket.js";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRoutes from "./routes/authRoute.js";
import errorHandler from "./middleware/errorMiddleware.js";
import rateLimiter from "./middleware/rateLimiter.js";
import { metricsMiddleware, metricsHandler } from "./middleware/metrics.js";

import helmet from "helmet";
import uploadRoutes from "./routes/uploadRoute.js";
import projectRoutes from "./routes/projectRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoute.js";
import expertRoute from "./routes/expertRoute.js";
import consultationRoute from "./routes/consultationRoute.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import notificationRoutes from "./routes/notificationRoute.js";
import eventRoutes from "./routes/eventRoute.js";
import bookmarkRoute from "./routes/bookmarkRoute.js";
import aiRoute from "./routes/aiRoute.js";
import investorProfileRoutes from "./routes/investorprofileroute.js";
import ddRoutes from "./routes/ddRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import webhookRoutes from "./routes/webhookRoute.js";
import programRoutes from "./routes/programRoute.js";
import searchRouter from "./routes/searchroute.js";
import { prisma } from "./config/prisma.js";

let job, matchRegenerationJob, narrativeRetryJob, analyticsJob;

dotenv.config({ override: false });

async function loadCron() {
  if (process.env.NODE_ENV !== "test") {
    try {
      const cron = await import("./config/cron.js");
      job = cron.default;
      matchRegenerationJob = cron.matchRegenerationJob;
      narrativeRetryJob = cron.narrativeRetryJob;
      analyticsJob = cron.analyticsJob;
    } catch (e) {
      console.error("Cron load failed:", e.message);
    }
  }
}

await loadCron();

const app = express();
app.use(helmet());

const allowedOrigins = [
  "http://localhost",
  "http://localhost:5173",
  "https://three60evo-frontend.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);
app.use("/api/webhooks", webhookRoutes);
app.use(express.json());
app.use(cookieParser());

app.use(metricsMiddleware);

if (
  process.env.NODE_ENV === "production" ||
  process.env.NODE_ENV === "development"
) {
  if (job) job.start();
  if (matchRegenerationJob) matchRegenerationJob.start();
  if (narrativeRetryJob) narrativeRetryJob.start();
  if (analyticsJob) analyticsJob.start();
}
app.get("/api/health", (req, res) => {
  res.send("Backend is running ");
});
app.post("/api/test-rag", async (req, res) => {
  try {
    console.error("[RAG-TEST] Starting RAG test...");
    console.error("[RAG-TEST] USE_RAG =", process.env.USE_RAG);
    console.error("[RAG-TEST] N8N_WEBHOOK_INGEST =", process.env.N8N_WEBHOOK_INGEST);

    if (process.env.USE_RAG !== "true") {
      return res.status(400).json({ error: "USE_RAG not set to true" });
    }

    const webhookUrl = process.env.N8N_WEBHOOK_INGEST;
    if (!webhookUrl) {
      return res.status(400).json({ error: "N8N_WEBHOOK_INGEST not configured" });
    }

    console.error("[RAG-TEST] Sending test webhook to:", webhookUrl);
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        docId: "test-123",
        dataRoomId: "test-room",
        fileUrl: "https://example.com/test.pdf",
        name: "test.pdf",
        callbackUrl: `${process.env.API_BASE_URL}/data-rooms/test/documents/test-123/rag-callback`,
      }),
    });

    const responseText = await response.text();
    console.error("[RAG-TEST] Webhook response status:", response.status);
    console.error("[RAG-TEST] Webhook response body:", responseText);

    res.json({
      success: true,
      webhookStatus: response.status,
      webhookResponse: responseText,
      envVars: {
        USE_RAG: process.env.USE_RAG,
        N8N_WEBHOOK_INGEST: process.env.N8N_WEBHOOK_INGEST,
        API_BASE_URL: process.env.API_BASE_URL,
      },
    });
  } catch (error) {
    console.error("[RAG-TEST] ERROR:", error.message, error.stack);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack 
    });
  }
});
app.get("/metrics", metricsHandler);

if (process.env.NODE_ENV === "test") {
  app.use("/api/auth", authRoutes);
} else {
  app.use("/api/auth", rateLimiter, authRoutes);
}
app.use("/api/uploads", uploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/experts", expertRoute);
app.use("/api/consultations", consultationRoute);
app.use("/api/conversations", conversationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/bookmarks", bookmarkRoute);
app.use("/api/ai", aiRoute);
app.use("/api/investor-profile", investorProfileRoutes);
app.use("/api", ddRoutes); // covers /api/dd-requests and /api/data-rooms
app.use("/api/payments", paymentRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/search", searchRouter);

const PORT = process.env.PORT || 5001;

if (process.env.NODE_ENV === "e2e") {
  console.log("E2E route registered");
  app.get("/api/e2e/verify-latest-user", async (req, res) => {
    try {
      const record = await prisma.emailVerification.findFirst({
        orderBy: { createdAt: "desc" },
      });
      if (!record)
        return res.status(404).json({ message: "No verification found" });

      await prisma.user.update({
        where: { id: record.userId },
        data: { isVerified: true },
      });
      await prisma.emailVerification.delete({ where: { id: record.id } });

      res.json({ message: "User verified" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
}

app.use(errorHandler);

console.log("JWT_SECRET:", process.env.JWT_SECRET);

const server = createServer(app);

const io = new Server(server, {
  path: "/api/socket.io",
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

initializeSocket(io);

global.io = io;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log("Server is up and running on PORT:", PORT);
  });
}
export default app;
