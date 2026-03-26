import express from "express";
import { protect, authorize } from "../middleware/auth.js";
import {
  getInvestorProfile,
  createInvestorProfile,
  updateInvestorProfile,
} from "../controllers/investorprofilecontroller.js";

const router = express.Router();

router.get("/", protect, authorize("INVESTOR", "ADMIN"), getInvestorProfile);
router.post("/", protect, authorize("INVESTOR"), createInvestorProfile);
router.put("/", protect, authorize("INVESTOR"), updateInvestorProfile);

export default router;
