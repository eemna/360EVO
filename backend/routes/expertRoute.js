import express from "express";
import {
  getPublicExpertProfile,
  getExperts,
  applyExpert,
  getExpertAvailability,
  updateAvailabilitySettings,
  listAvailabilityOverrides,
  upsertAvailabilityOverride,
  deleteAvailabilityOverride,
} from "../controllers/expertController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/apply", protect, applyExpert);
router.get("/", protect, getExperts);
router.put("/availability-settings", protect, updateAvailabilitySettings);
router.get("/availability-overrides", protect, listAvailabilityOverrides);
router.post("/availability-overrides", protect, upsertAvailabilityOverride);
router.delete(
  "/availability-overrides/:id",
  protect,
  deleteAvailabilityOverride,
);

router.get("/:id/availability", protect, getExpertAvailability);
router.get("/:id", protect, getPublicExpertProfile);

export default router;
