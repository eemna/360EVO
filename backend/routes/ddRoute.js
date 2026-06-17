import express from "express";
import { protect } from "../middleware/auth.js";
import {
  requestDueDiligence,
  getDdRequests,
  approveDdRequest,
  declineDdRequest,
  getDataRoom,
  addDocument,
  deleteDocument,
  createQaThread,
  replyToQaThread,
  runAiScan,
  suggestAnswer,
  generateDealBrief,
  getDealBrief,
  getQaThreads,
  getActivity,
  updateDocumentAccess,
  ragCallback,
} from "../controllers/ddController.js";

const router = express.Router();

// DD Requests
router.post("/dd-requests", protect, requestDueDiligence);
router.get("/dd-requests/:type", protect, getDdRequests); // :type = received|sent
router.put("/dd-requests/:id/approve", protect, approveDdRequest);
router.put("/dd-requests/:id/decline", protect, declineDdRequest);

// Data Rooms
router.get("/data-rooms/:id", protect, getDataRoom);
router.post("/data-rooms/:id/documents", protect, addDocument);
router.delete("/data-rooms/:id/documents/:docId", protect, deleteDocument);
router.put("/data-rooms/:id/documents/:docId", protect, updateDocumentAccess);
// Q&A
router.post("/data-rooms/:id/qa", protect, createQaThread);
router.post("/data-rooms/:id/qa/:threadId/reply", protect, replyToQaThread);
router.get("/data-rooms/:id/qa", protect, getQaThreads);
router.get("/data-rooms/:id/activity", protect, getActivity);

// AI
router.post("/data-rooms/:id/ai/scan", protect, runAiScan);
router.post("/data-rooms/:id/ai/suggest-answer", protect, suggestAnswer);
router.post("/data-rooms/:id/ai/deal-brief", protect, generateDealBrief);
router.get("/data-rooms/:id/ai/deal-brief", protect, getDealBrief);
router.post("/data-rooms/:id/documents/:docId/rag-callback", ragCallback);
export default router;
