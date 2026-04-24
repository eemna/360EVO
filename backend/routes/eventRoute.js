import express from "express";
import {
  getEvents,
  getMyEvents,
  getMyRegisteredEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  applyToEvent,
  getMyEventApplications,
  cancelRegistration,
} from "../controllers/eventController.js";
import { protect } from "../middleware/auth.js";
import {
  getEventApplications,
  updateEventApplicationStatus,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/", getEvents);

router.get("/user/mine", protect, getMyEvents);
router.get("/user/registered", protect, getMyRegisteredEvents);
router.get("/user/applications", protect, getMyEventApplications);

router.get("/:id", protect, getEventById);

router.post("/", protect, createEvent);

router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);
router.post("/:id/publish", protect, publishEvent);

router.post("/:id/register", protect, applyToEvent);
router.delete("/:id/register", protect, cancelRegistration);
router.get("/:id/applications", protect, getEventApplications);
router.put(
  "/:id/applications/:appId/status",
  protect,
  updateEventApplicationStatus,
);
export default router;
