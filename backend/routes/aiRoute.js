import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  assessProject,
  getAssessment,
  generateMatches,
  getMatchFeed,
  updateMatchStatus,
  getThesisAlignment,
  getInsights,
  getPitchAnalysis,
} from "../controllers/aiController.js";

const router = express.Router();

// Score a project — admin only
router.post("/assess/:projectId", protect, authorize("ADMIN"), assessProject);

// Get assessment for a project — any logged in user
router.get("/assessment/:projectId", protect, getAssessment);

// Generate matches for current investor
router.post(
  "/matches/generate",
  protect,
  authorize("INVESTOR"),
  generateMatches,
);

// Get match feed — investor only
router.get("/matches/feed", protect, authorize("INVESTOR"), getMatchFeed);

// Dismiss or restore a match
router.put(
  "/matches/:matchId/status",
  protect,
  authorize("INVESTOR"),
  updateMatchStatus,
);
router.post(
  "/thesis-alignment/:projectId",
  protect,
  authorize("INVESTOR"),
  getThesisAlignment,
);
router.get("/insights/:projectId", protect, authorize("INVESTOR"), getInsights);
router.post(
  "/pitch-analysis/:projectId",
  protect,
  authorize("INVESTOR"),
  getPitchAnalysis,
);

export default router;
