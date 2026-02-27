import { useState, useRef, useEffect } from "react";
import type { DragEvent, ChangeEvent } from "react";
import {
  Upload,
  X,
  FileText,
  File,
  Image,
  FileArchive,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "./button";
import axios from "axios";
import api from "../../../services/axios";
import { Input } from "./input";
import { Download } from "lucide-react";

interface CloudinaryResponse {
  url: string;
  publicId: string;
  originalName: string;
}

interface UploadedFile {
  id: string;
  file?: File;
  progress: number;
  status: "uploading" | "success" | "error";
  error?: string;
  cloudinaryData?: CloudinaryResponse;
}
export type UploadedDocument = {
  name: string;
  fileUrl: string;
  fileKey: string;
};

interface DocumentUploadProps {
  onFilesChange?: (files: UploadedDocument[]) => void;
  maxFiles?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  label?: string;
  description?: string;
  initialFiles?: UploadedDocument[];
}

export function DocumentUpload({
  onFilesChange,
  initialFiles = [],
  maxFiles = 5,
  maxSize = 20,
  acceptedTypes = [".pdf", ".doc", ".docx"],
  label = "Upload Documents",
  description = "Drag and drop your files here or click to browse",
}: DocumentUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>(() => {
    if (!initialFiles || initialFiles.length === 0) return [];

    return initialFiles.map((file) => ({
      id: file.fileKey,
      progress: 100,
      status: "success" as const,
      cloudinaryData: {
        url: file.fileUrl,
        publicId: file.fileKey,
        originalName: file.name,
      },
    }));
  });
  const [isDragging, setIsDragging] = useState(false);
  const [globalError, setGlobalError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadFile = (url: string, filename: string) => {
    fetch(url)
      .then((response) => response.blob())
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      });
  };

  useEffect(() => {
    if (!onFilesChange) return;

    const successFiles = uploadedFiles
      .filter((f) => f.status === "success" && f.cloudinaryData)
      .map((f) => ({
        name: f.cloudinaryData!.originalName,
        fileUrl: f.cloudinaryData!.url,
        fileKey: f.cloudinaryData!.publicId,
      }));

    onFilesChange(successFiles);
  }, [uploadedFiles, onFilesChange]);
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check if max files limit reached
    if (uploadedFiles.length >= maxFiles) {
      return {
        valid: false,
        error: `Maximum ${maxFiles} files allowed`,
      };
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${maxSize}MB limit`,
      };
    }

    // Check file type
    const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
    const isAccepted = acceptedTypes.some(
      (type) => type.toLowerCase() === fileExtension,
    );

    if (!isAccepted) {
      return {
        valid: false,
        error: `File type not accepted. Accepted: ${acceptedTypes.join(", ")}`,
      };
    }

    // Check for duplicates
    const isDuplicate = uploadedFiles.some(
      (uf) =>
        uf.file?.name === file.name ||
        uf.cloudinaryData?.originalName === file.name,
    );
    if (isDuplicate) {
      return {
        valid: false,
        error: "File already uploaded",
      };
    }

    return { valid: true };
  };

  const uploadFileToServer = async (uploadedFile: UploadedFile) => {
    const formData = new FormData();
    if (!uploadedFile.file) return;

    formData.append("file", uploadedFile.file);
    try {
      const response = await api.post("/uploads/document", formData, {
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );

            setUploadedFiles((prev) =>
              prev.map((f) =>
                f.id === uploadedFile.id ? { ...f, progress: percent } : f,
              ),
            );
          }
        },
      });
      const responseData = response.data as CloudinaryResponse;

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? {
                ...f,
                status: "success" as const,
                progress: 100,
                cloudinaryData: responseData,
              }
            : f,
        ),
      );
    } catch (err) {
      console.error("UPLOAD ERROR:", err);

      let message = "Upload failed";

      if (axios.isAxiosError<{ message: string }>(err)) {
        console.error("Status:", err.response?.status);
        console.error("Data:", err.response?.data);
        message = err.response?.data?.message || message;
      }

      setUploadedFiles((prev) =>
        prev.map((f) =>
          f.id === uploadedFile.id
            ? { ...f, status: "error", error: message }
            : f,
        ),
      );
    }
  };

  const handleFiles = (files: FileList) => {
    const filesArray = Array.from(files);
    setGlobalError("");

    filesArray.forEach((file) => {
      const validation = validateFile(file);

      if (validation.valid) {
        const newFile: UploadedFile = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          progress: 0,
          status: "uploading",
        };

        setUploadedFiles((prev) => [...prev, newFile]);
        uploadFileToServer(newFile);
      } else {
        setGlobalError(validation.error || "Validation failed");
        setTimeout(() => setGlobalError(""), 5000);
      }
    });
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = async (fileId: string) => {
    const fileToRemove = uploadedFiles.find((f) => f.id === fileId);

    // Delete from backend if exists
    if (fileToRemove?.cloudinaryData?.publicId) {
      try {
        await api.delete(
          `/uploads?key=${encodeURIComponent(
            fileToRemove.cloudinaryData.publicId,
          )}`,
        );
      } catch (error) {
        console.error("Failed to delete from server", error);
      }
    }

    // Just update state
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "pdf":
        return <FileText className="size-6 text-red-600" />;
      case "doc":
      case "docx":
        return <FileText className="size-6 text-blue-600" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <Image className="size-6 text-green-600" />;
      case "zip":
      case "rar":
        return <FileArchive className="size-6 text-orange-600" />;
      default:
        return <File className="size-6 text-gray-600" />;
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        <span className="text-xs text-gray-500">
          {uploadedFiles.length} / {maxFiles} files
        </span>
      </div>

      {/* Upload Zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          transition-all duration-300 mb-4
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 bg-gray-50"
          }
          ${uploadedFiles.length >= maxFiles ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        <Input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="hidden"
          multiple
          disabled={uploadedFiles.length >= maxFiles}
        />

        <div className="flex flex-col items-center">
          <div
            className={`
            size-12 rounded-full flex items-center justify-center mb-3
            ${isDragging ? "bg-blue-100" : "bg-gray-200"}
          `}
          >
            <Upload
              className={`size-6 ${isDragging ? "text-blue-600" : "text-gray-600"}`}
            />
          </div>

          <p className="text-sm font-medium text-gray-900 mb-1">
            {isDragging ? "Drop your files here" : description}
          </p>
          <p className="text-xs text-gray-500">
            {acceptedTypes.join(", ")} • Max {maxSize}MB per file • Up to{" "}
            {maxFiles} files
          </p>
        </div>
      </div>

      {/* Global Error */}
      {globalError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="size-4 flex-shrink-0" />
          <span>{globalError}</span>
        </div>
      )}

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          {uploadedFiles.map((uploadedFile) => (
            <div
              key={uploadedFile.id}
              className={`
                border rounded-lg p-3 bg-white transition-all
                ${uploadedFile.status === "error" ? "border-red-300 bg-red-50" : "border-gray-200"}
              `}
            >
              <div className="flex items-start gap-3">
                {/* File Icon */}
                <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  {getFileIcon(
                    uploadedFile.file?.name ||
                      uploadedFile.cloudinaryData?.originalName ||
                      "",
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {uploadedFile.file?.name ||
                          uploadedFile.cloudinaryData?.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {uploadedFile.file
                          ? formatFileSize(uploadedFile.file.size)
                          : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemove(uploadedFile.id)}
                      className="bg-gray-100 hover:bg-gray-200 shadow-none transition-colors"
                    >
                      <X className="size-4 text-red-500 " />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {uploadedFile.status === "uploading" && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadedFile.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Uploading... {uploadedFile.progress}%
                      </p>
                    </div>
                  )}

                  {uploadedFile.status === "success" &&
                    uploadedFile.cloudinaryData && (
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-green-600">
                          <Check className="size-3" />
                          <span className="text-xs font-medium">
                            Upload complete
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            downloadFile(
                              uploadedFile.cloudinaryData!.url,
                              uploadedFile.file?.name ||
                                uploadedFile.cloudinaryData?.originalName ||
                                "document",
                            )
                          }
                          className="flex items-center gap-2"
                        >
                          <Download className="size-4" />
                        </Button>
                      </div>
                    )}

                  {/* Error State */}
                  {uploadedFile.status === "error" && (
                    <div className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="size-3" />
                      <span className="text-xs font-medium">
                        {uploadedFile.error || "Upload failed"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {uploadedFiles.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">No files uploaded yet</p>
        </div>
      )}
    </div>
  );
}
