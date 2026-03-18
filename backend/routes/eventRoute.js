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
  registerForEvent,
  cancelRegistration,
} from "../controllers/eventController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getEvents);

router.get("/user/mine",       protect, getMyEvents);
router.get("/user/registered", protect, getMyRegisteredEvents);

router.get("/:id", protect, getEventById);


router.post("/", protect, createEvent);


router.put("/:id",           protect, updateEvent);
router.delete("/:id",        protect, deleteEvent);
router.post("/:id/publish",  protect, publishEvent);


router.post("/:id/register",   protect, registerForEvent);
router.delete("/:id/register", protect, cancelRegistration);

export default router;