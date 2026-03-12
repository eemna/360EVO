import express from "express";
import { getUserById, getUsers } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";

const router = express.Router();
router.get("/", protect, getUsers);
router.get("/settings", protect, getSettings);
router.put("/settings", protect, updateSettings);
router.get("/:id", protect, getUserById);
export default router;
