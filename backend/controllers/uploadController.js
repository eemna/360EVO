import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import path from "path";
export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const resizedImage = await sharp(req.file.buffer)
      .resize({ width: 1200, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "360EVO",
        resource_type: "image",
        
      },
      (error, result) => {
        if (error) return next(error);

        res.status(201).json({
          url: result.secure_url,
          publicId: result.public_id,
        });
      },
    );

    stream.end(resizedImage);
  } catch (error) {
    next(error);
  }
};

export const uploadDocumentController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const extension = path.extname(req.file.originalname).replace(".", "");
    const result = cloudinary.uploader.upload_stream(
      {
        folder: "360EVO/documents",
        resource_type: "raw",
        format: extension,
      },
      (error, result) => {
        if (error) {
          console.error("CLOUDINARY ERROR:", error);
          return res.status(500).json({ message: "Upload failed" });
        }

        return res.status(200).json({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: req.file.originalname,
        });
      },
    );

    // send buffer from multer memoryStorage
    result.end(req.file.buffer);
  } catch (error) {
    next(error);
  }
};
export const deleteFileController = async (req, res, next) => {
  try {
    const key = req.query.key;

    if (!key) {
      return res.status(400).json({ message: "File key is required" });
    }

    const isDocument = key.includes("documents");

    await cloudinary.uploader.destroy(key, {
      resource_type: isDocument ? "raw" : "image",
    });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    next(error);
  }
};
export const downloadDocumentController  = async (req, res, next) => {
  try {
    const { url, originalName } = req.query;

    if (!url || !originalName) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${originalName}"`
    );

    return res.redirect(url);

  } catch (error) {
    next(error);
  }
};