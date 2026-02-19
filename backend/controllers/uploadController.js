import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";

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
      }
    );

    stream.end(resizedImage);
  } catch (error) {
    next(error);
  }
};


export const uploadDocumentController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Document is required" });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "360EVO/documents",
        resource_type: "raw", // IMPORTANT for non-images
      },
      (error, result) => {
        if (error) return next(error);

        res.status(201).json({
          url: result.secure_url,
          publicId: result.public_id,
          originalName: req.file.originalname,
          size: req.file.size,
        });
      }
    );

    stream.end(req.file.buffer);
  } catch (error) {
    next(error);
  }
};
export const deleteFileController = async (req, res, next) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ message: "File key is required" });
    }

    // detect type from folder
    const isDocument = key.includes("documents");

    await cloudinary.uploader.destroy(key, {
      resource_type: isDocument ? "raw" : "image",
    });

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    next(error);
  }
};

