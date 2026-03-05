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
import job from "./config/cron.js";
import helmet from "helmet";
import uploadRoutes from "./routes/uploadRoute.js";
import projectRoutes from "./routes/projectRoute.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoute.js";
import conversationRoutes from "./routes/conversationRoutes.js";

dotenv.config();
const app = express();
app.use(helmet());

const allowedOrigins = [
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

app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === "production") job.start();

app.get("/api/health", (req, res) => {
  res.send("Backend is running ");
});
app.use("/api/auth", rateLimiter, authRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);

app.use("/api/conversations", conversationRoutes);
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

server.listen(PORT, () => {
  console.log("Server is up and running on PORT:", PORT);
});

