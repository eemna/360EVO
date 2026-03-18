import express from "express";
import {
  createProject,
  updateProject,
  deleteProject,
  submitProject,
  updateTeamMemberPhoto,
  getProjectById,
  getMyProjects,
  getFeaturedProjects,
  getPublicProjects,
  getStartupDashboard,
  createProjectUpdate,
  getProjectUpdates,
} from "../controllers/projectController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getPublicProjects);

router.get("/featured", getFeaturedProjects);
router.get("/dashboard", protect, getStartupDashboard);
router.get("/mine", protect, getMyProjects);
router.get("/:id", protect, getProjectById);
router.post("/", protect, createProject);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);
router.post("/:id/submit", protect, submitProject);
router.put(
  "/:projectId/team/:teamMemberId/photo",
  protect,
  updateTeamMemberPhoto,
);
router.post("/:id/updates", protect, createProjectUpdate);
router.get("/:id/updates", protect, getProjectUpdates);
export default router;
