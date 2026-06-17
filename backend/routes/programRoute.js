import express from "express";
import { protect } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  getPrograms,
  getProgramById,
  createProgram,
  updateProgram,
  applyToProgram,
  getMyApplications,
  updateApplicationStatus,
  getProgramApplications,
} from "../controllers/programController.js";

const router = express.Router();

router.get("/", protect, getPrograms);
router.get("/my-applications", protect, getMyApplications);
router.post("/", protect, requireAdmin, createProgram);
router.put("/:id", protect, requireAdmin, updateProgram);
router.post("/:id/apply", protect, applyToProgram);
router.get("/:id/applications", protect, requireAdmin, getProgramApplications);
router.put(
  "/:id/applications/:appId/status",
  protect,
  requireAdmin,
  updateApplicationStatus,
);
router.get("/:id", protect, getProgramById);

export default router;
