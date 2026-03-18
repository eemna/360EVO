import express from "express";
import {
  addBookmark,
  removeBookmark,
  getBookmarks,
  getBookmarkIds,
  expressInterest,
  getProjectInterests,
} from "../controllers/bookmarkController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getBookmarks);    
router.get("/ids", protect, getBookmarkIds);   
router.post("/:projectId", protect, addBookmark);  
router.delete("/:projectId", protect, removeBookmark);


router.post("/interests/:projectId", protect, expressInterest);     
router.get("/interests/:projectId", protect, getProjectInterests);

export default router;