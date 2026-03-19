import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getPendingProjects,
  approveProject,
  rejectProject,
  getAllUsers,
  updateUserRole,
  approveExpert,
  rejectExpert
} from "../controllers/adminController.js";

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/projects/pending", getPendingProjects);
router.patch("/projects/:id/approve", approveProject);
router.patch("/projects/:id/reject", rejectProject);

router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/experts/:id/approve", approveExpert);
router.patch("/experts/:id/reject", rejectExpert);

export default router;
