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
  verifyNewEmail,
  googleAuth,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import forgotPasswordRateLimit from "../middleware/forgotPasswordRateLimit.js";
import { requireRecaptcha } from "../middleware/recaptcha.js";

const router = express.Router();

router.post(
  "/register",
  requireRecaptcha("register"),
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
router.post("/login", requireRecaptcha("login"), login);
router.post("/google", requireRecaptcha("google_auth"), googleAuth);
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.post("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  requireRecaptcha("resend_verification"),
  resendVerification,
);
router.post(
  "/forgot-password",
  requireRecaptcha("forgot_password"),
  forgotPasswordRateLimit,
  forgotPassword,
);
router.post("/reset-password", requireRecaptcha("reset_password"), resetPassword);
router.post("/refresh-token", refreshToken);
router.put("/change-password", protect, changePassword);
router.put("/update-email", protect, updateEmail);
router.put("/update-profile", protect, updateProfile);
router.post("/verify-new-email", protect, verifyNewEmail);

export default router;
