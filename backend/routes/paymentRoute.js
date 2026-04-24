import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createPaymentIntent,
  getMyPayments,
  confirmPayment,
  createProgramPaymentIntent,
  confirmProgramPayment,
  confirmConsultationPayment,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-intent", protect, createPaymentIntent);
router.post("/confirm", protect, confirmPayment);
router.get("/my-payments", protect, getMyPayments);
router.post("/program/create-intent", protect, createProgramPaymentIntent);
router.post("/program/confirm", protect, confirmProgramPayment);
router.post("/consultation/confirm", protect, confirmConsultationPayment);
export default router;
