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

let job, matchRegenerationJob, narrativeRetryJob, analyticsJob;

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

dotenv.config();
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
if (process.env.NODE_ENV === "production" && job) {
  job.start();
  matchRegenerationJob.start();
  narrativeRetryJob.start();
  analyticsJob.start();
}
app.get("/api/health", (req, res) => {
  res.send("Backend is running ");
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