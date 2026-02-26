import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getPendingProjects,
  approveProject,
  rejectProject,
  getAllUsers,
  updateUserRole,
} from "../controllers/adminController.js";

const router = express.Router();

// All routes require ADMIN role
router.use(protect, authorize("ADMIN"));

router.get("/projects/pending", getPendingProjects);
router.patch("/projects/:id/approve", approveProject);
router.patch("/projects/:id/reject", rejectProject);

router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);

export default router;