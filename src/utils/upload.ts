import multer from "multer";
import { Storage } from "@google-cloud/storage";
import { Request, Response, NextFunction } from "express";
import path from "path";
import { getEnvironmentConfig } from "./config.js";

const config = getEnvironmentConfig();

// Initialize Google Cloud Storage
// It will automatically use GOOGLE_APPLICATION_CREDENTIALS environment variable
// which we configure in the Dockerfile to point to the decoded JSON key file.
const storage = new Storage({
  projectId: config.GCS_PROJECT_ID,
});

const bucket = storage.bucket(config.GCS_BUCKET_NAME);

// Configure multer to use Memory Storage (we handle GCS upload manually)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 5 // 5MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type, only JPEG and PNG is allowed!"));
    }
  }
});

// Helper to upload a single file buffer to GCS
const uploadFileToGCS = (file: Express.Multer.File): Promise<void> => {
  return new Promise((resolve, reject) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + "-" + uniqueSuffix + ext;
    
    const blob = bucket.file(filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on('error', (err) => {
      reject(err);
    });

    blobStream.on('finish', () => {
      // Set the file properties to match what controllers expect
      file.filename = filename;
      file.path = `https://storage.googleapis.com/${config.GCS_BUCKET_NAME}/${filename}`;
      resolve();
    });

    blobStream.end(file.buffer);
  });
};

// Middleware wrapper for single image upload that uploads to GCS after multer parses it
const uploadSingleImage = (req: Request, res: Response, next: NextFunction) => {
  const handler = upload.single("sondagePhoto");
  handler(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    try {
      await uploadFileToGCS(req.file);
      next();
    } catch (error) {
      next(error);
    }
  });
};

// Middleware wrapper for multiple images upload
const uploadMultipleImages = (req: Request, res: Response, next: NextFunction) => {
  const handler = upload.array("sondagePhotos", 10);
  handler(req, res, async (err) => {
    if (err) return next(err);
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) return next();

    try {
      const files = req.files as Express.Multer.File[];
      await Promise.all(files.map(file => uploadFileToGCS(file)));
      next();
    } catch (error) {
      next(error);
    }
  });
};

// Method to delete a file from GCS
const deleteFile = async (filePath: string): Promise<boolean> => {
  try {
    let objectName = filePath;
    // Extract object name if full URL is passed
    if (filePath.startsWith('http')) {
        const parts = filePath.split('/');
        objectName = parts[parts.length - 1]; // This is simplistic, but works for standard GCS public URLs
    }
    
    await bucket.file(objectName).delete();
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
    // We wrap uploadSingleImage which is now a (req, res, next) middleware
    return new Promise((resolve, reject) => {
      // Create a fake 'next' function to capture success or error
      const next = (err?: any) => {
          if (err) {
              console.error("Error uploading new file during update:", err);
              reject(null);
          } else {
              // Success
              if (!req.file) {
                  reject(null);
              } else {
                  resolve(req.file.filename);
              }
          }
      };
      
      uploadSingleImage(req, res, next);
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
    const next = (err?: any) => {
        if (err) {
           console.error("Error uploading image:", err);
           resolve(null);
        } else {
           if (!req.file) {
               resolve(null);
           } else {
               resolve(req.file.filename);
           }
        }
    };
    uploadSingleImage(req, res, next);
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
