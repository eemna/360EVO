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
} from "../controllers/projectController.js";

import { protect } from "../middleware/auth.js";

const router = express.Router();



// Public gallery (search + filters)
router.get("/", getPublicProjects);

// Featured projects
router.get("/featured", getFeaturedProjects);

// Single project (increments viewCount)
router.get("/:id", getProjectById);



// My projects
router.get("/mine", protect, getMyProjects);

// Create project
router.post("/", protect, createProject);

// Update project
router.put("/:id", protect, updateProject);

// Delete project
router.delete("/:id", protect, deleteProject);

// Submit project
router.post("/:id/submit", protect, submitProject);

// Update team member photo
router.put(
  "/:projectId/team/:teamMemberId/photo",
  protect,
  updateTeamMemberPhoto
);

export default router;