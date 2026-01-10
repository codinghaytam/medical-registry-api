import multer from "multer";
import { Storage } from "@google-cloud/storage";
import MulterGoogleStorage from "multer-google-storage";
import path from "path";
import { getEnvironmentConfig } from "./config.js";
const config = getEnvironmentConfig();
// Initialize Google Cloud Storage
const storage = new Storage({
    projectId: config.GCS_PROJECT_ID,
    credentials: JSON.parse(config.GCS_SA_KEY)
});
const bucket = storage.bucket(config.GCS_BUCKET_NAME);
// Configure multer to use Google Cloud Storage
const gcsStorage = new MulterGoogleStorage({
    bucket: config.GCS_BUCKET_NAME,
    projectId: config.GCS_PROJECT_ID,
    credentials: JSON.parse(config.GCS_SA_KEY),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type, only JPEG and PNG is allowed!"), false);
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
const deleteFile = async (filePath) => {
    try {
        // filePath is the full name/path of the object in the bucket
        await bucket.file(filePath).delete();
        return true;
    }
    catch (error) {
        console.error(`Failed to delete file ${filePath} from GCS:`, error);
        return false;
    }
};
// Method to update a file (delete old and upload new)
const updateFile = async (oldFilePath, req, res) => {
    try {
        // Delete the old file if it exists
        if (oldFilePath) {
            await deleteFile(oldFilePath);
        }
        // Upload the new file
        return new Promise((resolve, reject) => {
            uploadSingleImage(req, res, (err) => {
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
                resolve(req.file.filename);
            });
        });
    }
    catch (error) {
        console.error("Error updating file:", error);
        return null;
    }
};
// Helper to get file extension
const getFileExtension = (filename) => {
    return path.extname(filename).toLowerCase();
};
// Helper to check if file is a valid image
const isValidImageFile = (filename) => {
    const ext = getFileExtension(filename);
    return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
};
// Helper function to delete image if needed
const deleteImageIfExists = async (sondagePhoto) => {
    if (sondagePhoto) {
        try {
            await deleteFile(sondagePhoto);
        }
        catch (error) {
            console.error('Failed to delete image:', error);
        }
    }
};
// Helper function to handle uploadSingleImage as a Promise
const uploadImagePromise = (req, res) => {
    return new Promise((resolve) => {
        uploadSingleImage(req, res, (err) => {
            if (err) {
                console.error("Error uploading image:", err);
                resolve(null);
                return;
            }
            if (!req.file) {
                resolve(null);
                return;
            }
            resolve(req.file.filename);
        });
    });
};
export { upload, uploadSingleImage, uploadMultipleImages, deleteFile, updateFile, isValidImageFile, getFileExtension, deleteImageIfExists, uploadImagePromise };
