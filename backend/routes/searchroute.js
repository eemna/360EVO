import express from "express";
import { globalSearch, autocomplete } from "../controllers/searchcontroller.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, globalSearch);

router.get("/autocomplete", protect, autocomplete);

export default router;
