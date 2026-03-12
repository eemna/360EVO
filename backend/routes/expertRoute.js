import express from "express";
import {
  getPublicExpertProfile,
  getExperts,
  applyExpert,
} from "../controllers/expertController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();
router.post("/apply", protect, applyExpert);
router.get("/", protect, getExperts);
router.get("/:id", getPublicExpertProfile);
export default router;
