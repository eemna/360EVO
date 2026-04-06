import express from "express";
import { protect } from "../middleware/auth.js";
import {
  createPaymentIntent,
  confirmPayment,
  getMyPayments,
} from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-intent", protect, createPaymentIntent);
router.post("/confirm", protect, confirmPayment);
router.get("/my-payments", protect, getMyPayments);

export default router;