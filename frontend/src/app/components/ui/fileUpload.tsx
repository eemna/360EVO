import { useState, useRef } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { Upload, X, File, Check, AlertCircle } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import api from "../../../services/axios";
import { useNavigate } from "react-router";
import type { ReactNode } from "react";
import { AxiosError } from "axios";

interface FileUploadProps {
  onFileSelect?: (data: { url: string; publicId: string } | null) => void;
  existingFileUrl?: string;
  accept?: string;
  maxSize?: number;
  label?: string;
  description?: string;
  children?: ReactNode;
}

export function FileUpload({
  onFileSelect,
  existingFileUrl,
  accept = "*",
  maxSize = 5,
  label = "Upload File",
  description = "Drag and drop your file here or click to browse",
  children,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const [previewUrl, setPreviewUrl] = useState<string>(existingFileUrl || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    const fileSizeMB = file.size / (1024 * 1024);

    if (fileSizeMB > maxSize) {
      setError(`File size exceeds ${maxSize}MB limit`);
      return false;
    }

    if (accept !== "*") {
      const acceptedTypes = accept.split(",").map((type) => type.trim());
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
      const mimeType = file.type;

      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith(".")) {
          return fileExtension === type.toLowerCase();
        }
        if (type.endsWith("/*")) {
          return mimeType.startsWith(type.replace("/*", ""));
        }
        return mimeType === type;
      });

      if (!isAccepted) {
        setError(`File type not accepted. Accepted types: ${accept}`);
        return false;
      }
    }

    setError("");
    return true;
  };

  const generatePreview = (file: File) => {
    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl("");
    }
  };
  const uploadToServer = async (selectedFile: File) => {
    const formData = new FormData();

    const isImage = selectedFile.type.startsWith("image/");
    const fieldName = isImage ? "image" : "file";
    const endpoint = isImage ? "/uploads/image" : "/uploads/document";

    formData.append(fieldName, selectedFile);

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError("");

      const response = await api.post(endpoint, formData, {
        //  DO NOT set Content-Type manually
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percent);
          }
        },
      });

      setUploadProgress(100);
      setIsUploading(false);

      // Only now confirm success
      onFileSelect?.({
        url: response.data.url,
        publicId: response.data.publicId,
      });
    } catch (err) {
      setIsUploading(false);
      setUploadProgress(0);
      setFile(null);
      setPreviewUrl("");

      const error = err as AxiosError<{ message: string }>;

      if (error.response?.status === 401) {
        localStorage.removeItem("accessToken");
        navigate("/login");
        return;
      }

      const backendMessage = error.response?.data?.message;
      setError(backendMessage || "Upload failed. Please try again.");
    }
  };

  const handleFile = async (selectedFile: File) => {
    if (!validateFile(selectedFile)) return;

    setFile(selectedFile);

    //  Upload first
    await uploadToServer(selectedFile);

    // Only generate preview after upload starts (safe)
    generatePreview(selectedFile);
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

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl("");
    setUploadProgress(0);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileSelect?.(null);
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

  return (
    <div className="w-full">
      {/* ALWAYS render hidden input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />

      {!children && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {children ? (
        <div onClick={handleClick}>{children}</div>
      ) : (
        <>
          {!file && !previewUrl ? (
            <div
              onClick={handleClick}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-300
            ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400 bg-gray-50"
            }
            ${error ? "border-red-300 bg-red-50" : ""}
          `}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`
              size-12 rounded-full flex items-center justify-center mb-4
              ${isDragging ? "bg-blue-100" : "bg-gray-200"}
              ${error ? "bg-red-100" : ""}
            `}
                >
                  {error ? (
                    <AlertCircle className="size-6 text-red-600" />
                  ) : (
                    <Upload
                      className={`size-6 ${isDragging ? "text-blue-600" : "text-gray-600"}`}
                    />
                  )}
                </div>

                <p className="text-sm font-medium text-gray-900 mb-1">
                  {isDragging ? "Drop your file here" : description}
                </p>
                <p className="text-xs text-gray-500">
                  {accept !== "*"
                    ? `Accepted formats: ${accept}`
                    : "Any file type"}{" "}
                  • Max size: {maxSize}MB
                </p>
              </div>

              {error && (
                <div className="mt-4 text-sm text-red-600 flex items-center justify-center gap-2">
                  <AlertCircle className="size-4" />
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4 bg-white">
              <div className="flex items-start gap-4">
                {/* Preview */}
                {previewUrl ? (
                  <div className="size-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                    <img
                      src={previewUrl}
                      alt={file?.name || "Preview"}
                      className="size-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="size-16 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <File className="size-8 text-blue-600" />
                  </div>
                )}

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file?.name || "Uploaded file"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {file ? formatFileSize(file.size) : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={handleRemove}
                      className="h-8 w-8"
                    >
                      <X className="size-4 text-red-500" />
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {isUploading && (
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}

                  {/* Success State */}
                  {!isUploading && uploadProgress === 100 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <Check className="size-4" />
                      <span className="text-xs font-medium">
                        Upload complete
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}{" "}
        </>
      )}
    </div>
  );
}
