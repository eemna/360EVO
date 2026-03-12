import express from "express";
import { protect } from "../middleware/auth.js";
import {
  getNotifications,
  markOneRead,
  markAllRead,
  clearAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read-all", protect, markAllRead);
router.put("/:id/read", protect, markOneRead);
router.delete("/clear-all", protect, clearAllNotifications);
export default router;
