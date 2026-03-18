import multer from "multer";

const storage = multer.memoryStorage();

const imageFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP allowed"), false);
  }
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, 
  fileFilter: imageFilter,
});

const documentFilter = (req, file, cb) => {
  console.log("MIME TYPE:", file.mimetype);
  const allowed = [
    "application/pdf",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOC, DOCX allowed"), false);
  }
};

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, 
  fileFilter: documentFilter,
});
