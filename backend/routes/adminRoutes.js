import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getPendingProjects,
  approveProject,
  rejectProject,
  getAllUsers,
  updateUserRole,
  approveExpert,
  rejectExpert,
  suspendUser,
  unsuspendUser,
  getevents,
  getEventRegistrations,
  getEventApplications,
  updateEventApplicationStatus,
} from "../controllers/adminController.js";
import {
  getAdminStats,
  getAllPrograms,
  getRevenueReport,
  getProgramApplications,
} from "../controllers/programController.js";

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/projects/pending", getPendingProjects);
router.patch("/projects/:id/approve", approveProject);
router.patch("/projects/:id/reject", rejectProject);

router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/experts/:id/approve", approveExpert);
router.patch("/experts/:id/reject", rejectExpert);
router.patch("/users/:id/suspend", suspendUser);
router.patch("/users/:id/unsuspend", unsuspendUser);

router.get("/stats", getAdminStats);
router.get("/programs", getAllPrograms);
router.get("/programs/:id/applications", getProgramApplications);
router.get("/reports/revenue", getRevenueReport);

router.get("/events", getevents);
router.get("/events/:id/registrations", getEventRegistrations);
router.get("/events/:id/applications", getEventApplications);
router.put("/events/:id/applications/:appId/status", updateEventApplicationStatus);
export default router;
