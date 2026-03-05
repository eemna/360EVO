import express from "express";
import { body } from "express-validator";
import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  resendVerification,
  refreshToken,
  getMe,
  logout,
  changePassword,
  updateEmail,
  updateProfile,
  getPublicExpertProfile, 
  createBooking,
  getExpertBookings,
  acceptBooking,
  rejectBooking,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import forgotPasswordRateLimit from "../middleware/forgotPasswordRateLimit.js";

const router = express.Router();

router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("role").notEmpty().withMessage("Role is required"),
  ],
  register,
);
router.post("/login", login);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/forgot-password", forgotPasswordRateLimit, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh-token", refreshToken);
router.put("/change-password", protect, changePassword);
router.put("/update-email", protect, updateEmail);
router.put("/update-profile", protect, updateProfile);
router.get("/experts/:id", getPublicExpertProfile);
router.post("/bookings", protect, createBooking);
router.get("/bookings/expert/:expertId", getExpertBookings);
router.patch("/:id/accept", protect, acceptBooking);
router.patch("/:id/reject", protect, rejectBooking);
export default router;
