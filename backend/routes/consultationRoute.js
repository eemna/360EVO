import express from "express";
import {
  createBooking,
  getConsultations,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
  createReview,
  getEarningsOverview,
} from "../controllers/consultationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/request", protect, createBooking);
router.get("/", protect, getConsultations);
router.get("/earnings", protect, getEarningsOverview);
router.patch("/:id/accept", protect, acceptBooking);
router.patch("/:id/reject", protect, rejectBooking);
router.patch("/:id/cancel", protect, cancelBooking);
router.patch("/:id/complete", protect, completeBooking);
router.post("/:id/review", protect, createReview);
export default router;
