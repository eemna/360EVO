import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";

const onlineUsers = new Map(); 
// Map<userId, Set<socketId>>

export const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      
       console.log("Handshake auth:", socket.handshake.auth);
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);

    const token = socket.handshake.auth.token;
    console.log("Received token:", token);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded:", decoded);

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user) return next(new Error("User not found"));

      socket.user = user;
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

 io.on("connection", (socket) => {
  const userId = socket.user.id;

  console.log("User connected:", userId);

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }

  onlineUsers.get(userId).add(socket.id);

  // Send online_users event ONLY to this user, Send full online list to the newly connected user
  socket.emit("online_users", Array.from(onlineUsers.keys()));

  // Emit globally only if first active socket
  if (onlineUsers.get(userId).size === 1) {
    io.emit("user_online", userId);
  }

  socket.join(userId); // personal room

    socket.on("join_conversation", (conversationId) => {
      socket.join(conversationId);
    });

    socket.on("typing_start", ({ conversationId }) => {
      socket.to(conversationId).emit("typing_start", { userId });
    });

    socket.on("typing_stop", ({ conversationId }) => {
      socket.to(conversationId).emit("typing_stop", { userId });
    });

    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(userId);

      if (!userSockets) return;

      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit("user_offline", userId);
      }
    });
  });
};

// Helper
export const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};