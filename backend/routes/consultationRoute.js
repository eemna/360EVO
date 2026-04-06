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
  confirmPayment,
  cancelUnpaidBooking,
  createConsultationPaymentIntent,
} from "../controllers/consultationController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/request", protect, createBooking);
router.get("/", protect, getConsultations);
router.get("/earnings", protect, getEarningsOverview);
router.patch("/:id/pay", protect, confirmPayment);
router.patch("/:id/cancel-unpaid", protect, cancelUnpaidBooking);
router.post("/create-payment-intent", protect, createConsultationPaymentIntent);
router.put("/:id/accept", protect, acceptBooking);
router.put("/:id/reject", protect, rejectBooking);
router.put("/:id/cancel", protect, cancelBooking);
router.put("/:id/complete", protect, completeBooking);
router.post("/:id/review", protect, createReview);
export default router;
