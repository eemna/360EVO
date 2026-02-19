import express from "express";
import {
  uploadImage as uploadImageMiddleware,
  uploadDocument,
} from "../middleware/upload.js";

import {
  uploadImage,
  uploadDocumentController,
  deleteFileController,
} from "../controllers/uploadController.js";

const router = express.Router();


router.post(
  "/image",
  uploadImageMiddleware.single("image"),
  uploadImage
);


router.post(
  "/document",
  uploadDocument.single("file"),
  uploadDocumentController
);


router.delete("/:key", deleteFileController);

export default router;
