import express from "express";
import { protect } from "../middleware/auth.js";
import { getProjectAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();
router.get("/:id/analytics", protect, getProjectAnalytics);
export default router;