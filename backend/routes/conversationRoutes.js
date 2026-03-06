// routes/conversationRoutes.js

import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createConversation,
  sendMessage,
  getMessages,
  getConversations,
  markAsRead,
} from "../controllers/conversationController.js";

const router = express.Router();

router.post("/", protect, createConversation);
router.post("/:id/messages", protect, sendMessage);
router.get("/:id/messages", protect, getMessages);
router.get("/", protect, getConversations);
router.put("/messages/read", protect, markAsRead);
router.get("/me-test", protect, (req, res) => {
  res.json({ userId: req.user.id });
});

export default router;
