import multer from "multer";
import { Storage } from "@google-cloud/storage";
import MulterGoogleStorage from "multer-google-storage";
import { Request, Response } from "express";
import path from "path";
import { getEnvironmentConfig } from "./config.js";

const config = getEnvironmentConfig();

const parseCredentials = (credentials: string) => {
  if (!credentials) return undefined;
  try {
    return JSON.parse(credentials);
  } catch (error) {
    console.warn("⚠️ GCS_SA_KEY JSON parse failed. Attempting auto-repair...");
    try {
      // Repair strategy:
      // 1. Replace single quotes with double quotes
      // 2. Wrap unquoted keys in double quotes
      let fixed = credentials
        .replace(/'/g, '"')
        .replace(/([{,]\s*)([a-zA-Z0-9_]+?)\s*:/g, '$1"$2":');
      
      const parsed = JSON.parse(fixed);
      console.log("✅ GCS_SA_KEY auto-repaired successfully.");
      return parsed;
    } catch (finalError) {
       console.error("❌ Failed to parse GCS_SA_KEY environment variable.");
       console.error("Original Error:", error instanceof Error ? error.message : error);
       
       // Log masked snippet
       const snippet = credentials.length > 50 ? credentials.substring(0, 50) + "..." : credentials;
       console.error(`Input Start: [${snippet}]`);
       
       console.warn("⚠️ Falling back to Application Default Credentials (ADC). verify that the service account is attached to the Cloud Run service.");
       return undefined;
    }
  }
};

const credentials = parseCredentials(config.GCS_SA_KEY);

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: config.GCS_PROJECT_ID,
  credentials
});

const bucket = storage.bucket(config.GCS_BUCKET_NAME);

// Configure multer to use Google Cloud Storage
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const gcsStorage = (MulterGoogleStorage as any).storageEngine({
  bucket: config.GCS_BUCKET_NAME,
  projectId: config.GCS_PROJECT_ID,
  credentials,
  filename: (req: Request, file: Express.Multer.File, cb: (err: any, filename?: string) => void) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type, only JPEG and PNG is allowed!"));
  }
};

const upload = multer({
  storage: gcsStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  }
});

// Method to upload a single image
const uploadSingleImage = upload.single("sondagePhoto");

// Method to upload multiple images
const uploadMultipleImages = upload.array("sondagePhotos", 10);

// Method to delete a file from GCS
const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    // filePath is the full name/path of the object in the bucket
    await bucket.file(filePath).delete();
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${filePath} from GCS:`, error);
    return false;
  }
};

// Method to update a file (delete old and upload new)
const updateFile = async (oldFilePath: string, req: Request, res: Response): Promise<string | null> => {
  try {
    // Delete the old file if it exists
    if (oldFilePath) {
      await deleteFile(oldFilePath);
    }
    
    // Upload the new file
    return new Promise((resolve, reject) => {
      uploadSingleImage(req, res, (err: any) => {
        if (err) {
          console.error("Error uploading new file during update:", err);
          reject(null);
          return;
        }
        if (!req.file) {
          reject(null);
          return;
        }
        // The filename from multer-google-storage is the object name in the bucket
        resolve((req.file as any).filename);
      });
    });
  } catch (error) {
    console.error("Error updating file:", error);
    return null;
  }
};

// Helper to get file extension
const getFileExtension = (filename: string): string => {
  return path.extname(filename).toLowerCase();
};

// Helper to check if file is a valid image
const isValidImageFile = (filename: string): boolean => {
  const ext = getFileExtension(filename);
  return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
};

// Helper function to delete image if needed
const deleteImageIfExists = async (sondagePhoto: string | null): Promise<void> => {
  if (sondagePhoto) {
    try {
      await deleteFile(sondagePhoto);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }
};

// Helper function to handle uploadSingleImage as a Promise
const uploadImagePromise = (req: Request, res: Response): Promise<string | null> => {
  return new Promise((resolve) => {
    uploadSingleImage(req, res, (err: any) => {
      if (err) {
        console.error("Error uploading image:", err);
        resolve(null);
        return;
      }
      
      if (!req.file) {
        resolve(null);
        return;
      }
      
      resolve((req.file as any).filename);
    });
  });
};

export {
  upload,
  uploadSingleImage,
  uploadMultipleImages,
  deleteFile,
  updateFile,
  isValidImageFile,
  getFileExtension,
  deleteImageIfExists,
  uploadImagePromise
};
