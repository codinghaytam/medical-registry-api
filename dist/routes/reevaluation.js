import express from "express";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import path from "path";
import { deleteImageIfExists } from "../utils/upload.js";
import { validateKeycloakToken } from "../utils/keycloak.js";
const routes = express.Router();
const prisma = new PrismaClient();
// Configure storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});
// File filter to only allow jpg, jpeg and png
const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/jpg") {
        cb(null, true);
    }
    else {
        cb(null, false);
    }
};
// Configure multer upload
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
});
// Upload middleware
const uploadSingleImage = upload.single('sondagePhoto');
// Get all reevaluations
routes.get("/", validateKeycloakToken, async function (_req, res, _next) {
    try {
        const reevaluations = await prisma.reevaluation.findMany({
            include: {
                seance: {
                    include: {
                        patient: true,
                        medecin: {
                            include: {
                                user: true
                            }
                        },
                        Reevaluation: true
                    }
                }
            }
        });
        if (!Array.isArray(reevaluations)) {
            throw new Error("Failed to fetch reevaluations");
        }
        // Transform the response to include full image URLs if needed
        const reevaluationsWithImageUrls = reevaluations.map(reevaluation => ({
            ...reevaluation,
            sondagePhoto: reevaluation.sondagePhoto
                ? `/uploads/${reevaluation.sondagePhoto}`
                : null
        }));
        res.status(200).send(reevaluationsWithImageUrls);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch reevaluations" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Get a single reevaluation by ID
routes.get("/:id", validateKeycloakToken, async function (req, res, _next) {
    try {
        const reevaluation = await prisma.reevaluation.findUnique({
            where: { id: req.params.id },
            include: {
                seance: {
                    include: {
                        patient: true,
                        medecin: {
                            include: {
                                user: true
                            }
                        },
                        Reevaluation: true
                    }
                }
            }
        });
        if (!reevaluation) {
            res.status(404).send({ error: "Reevaluation not found" });
            return;
        }
        // Transform the response to include full image URL if needed
        const responseData = {
            ...reevaluation,
            sondagePhoto: reevaluation.sondagePhoto
                ? `/uploads/${reevaluation.sondagePhoto}`
                : null
        };
        res.status(200).send(responseData);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch reevaluation" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Create a new reevaluation
routes.post("/", validateKeycloakToken, uploadSingleImage, async function (req, res, _next) {
    try {
        // Validate required fields
        console.log('Request body:', req.body);
        console.log('File:', req.file);
        // Extract reevaluation data from request body
        const { indiceDePlaque, indiceGingivale, patientId, medecinId, date, type = 'REEVALUATION' // Default to REEVALUATION type for the seance
         } = req.body;
        // Get image path from uploaded file - use filename instead of fieldname
        const imagePath = req.file?.filename;
        console.log('Image path:', imagePath);
        // Use a transaction to create both Seance and Reevaluation
        const result = await prisma.$transaction(async (tx) => {
            // First, create the Seance
            const newSeance = await tx.seance.create({
                data: {
                    type: type,
                    date: new Date(date),
                    patient: {
                        connect: { id: patientId }
                    },
                    medecin: {
                        connect: { id: medecinId }
                    }
                }
            });
            // Then create the Reevaluation linked to the Seance
            const newReevaluation = await tx.reevaluation.create({
                data: {
                    indiceDePlaque: parseFloat(indiceDePlaque),
                    indiceGingivale: parseFloat(indiceGingivale),
                    sondagePhoto: imagePath,
                    seance: {
                        connect: { id: newSeance.id }
                    }
                },
                include: {
                    seance: {
                        include: {
                            patient: true,
                            medecin: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    }
                }
            });
            return newReevaluation;
        });
        // Add full image URL to response
        const responseData = {
            ...result,
            sondagePhoto: result.sondagePhoto
                ? `/uploads/${result.sondagePhoto}`
                : null
        };
        res.status(201).send(responseData);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to create reevaluation and seance" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Update an existing reevaluation
routes.put("/:id", validateKeycloakToken, uploadSingleImage, async function (req, res, _next) {
    try {
        // Validate ID parameter
        if (!req.params.id || typeof req.params.id !== 'string') {
            res.status(400).send({ error: "Invalid reevaluation ID" });
            return;
        }
        // Check if reevaluation exists
        const existingReevaluation = await prisma.reevaluation.findUnique({
            where: { id: req.params.id }
        });
        if (!existingReevaluation) {
            res.status(404).send({ error: "Reevaluation not found" });
            return;
        }
        // Extract and validate data from request body
        const { indiceDePlaque, indiceGingivale, seanceId } = req.body;
        // Validate numeric fields if provided
        if (indiceDePlaque !== undefined) {
            const parsedIndiceDePlaque = parseFloat(indiceDePlaque);
            if (isNaN(parsedIndiceDePlaque) || parsedIndiceDePlaque < 0) {
                res.status(400).send({ error: "Invalid indiceDePlaque value. Must be a positive number." });
                return;
            }
        }
        if (indiceGingivale !== undefined) {
            const parsedIndiceGingivale = parseFloat(indiceGingivale);
            if (isNaN(parsedIndiceGingivale) || parsedIndiceGingivale < 0) {
                res.status(400).send({ error: "Invalid indiceGingivale value. Must be a positive number." });
                return;
            }
        }
        // Validate seanceId if provided
        if (seanceId) {
            try {
                const seanceExists = await prisma.seance.findUnique({
                    where: { id: seanceId }
                });
                if (!seanceExists) {
                    res.status(400).send({ error: "Referenced seance not found" });
                    return;
                }
            }
            catch (seanceError) {
                console.error('Error validating seance:', seanceError);
                res.status(400).send({ error: "Invalid seance ID format" });
                return;
            }
        }
        // Handle file upload - use the file directly from the request
        let imagePath = existingReevaluation.sondagePhoto;
        // If a new file is uploaded, delete the old one and use the new one
        if (req.file) {
            try {
                // Delete the old file if it exists
                if (existingReevaluation.sondagePhoto) {
                    await deleteImageIfExists(existingReevaluation.sondagePhoto);
                }
                // Use the new file
                imagePath = req.file.filename;
            }
            catch (fileError) {
                console.error('Error handling file upload:', fileError);
                res.status(500).send({ error: "Failed to process image upload" });
                return;
            }
        }
        // Prepare update data
        const updateData = {
            sondagePhoto: imagePath,
        };
        if (indiceDePlaque !== undefined) {
            updateData.indiceDePlaque = parseFloat(indiceDePlaque);
        }
        if (indiceGingivale !== undefined) {
            updateData.indiceGingivale = parseFloat(indiceGingivale);
        }
        if (seanceId) {
            updateData.seance = {
                connect: { id: seanceId }
            };
        }
        // Update reevaluation
        const updatedReevaluation = await prisma.reevaluation.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                seance: {
                    include: {
                        patient: true,
                        medecin: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });
        // Add full image URL to response
        const responseData = {
            ...updatedReevaluation,
            sondagePhoto: updatedReevaluation.sondagePhoto
                ? `/uploads/${updatedReevaluation.sondagePhoto}`
                : null
        };
        res.status(200).send(responseData);
    }
    catch (e) {
        console.error('Error updating reevaluation:', e);
        // Handle specific Prisma errors
        if (e instanceof Error) {
            if (e.message.includes('Record to update not found')) {
                res.status(404).send({ error: "Reevaluation not found" });
                return;
            }
            if (e.message.includes('Foreign key constraint')) {
                res.status(400).send({ error: "Invalid reference to related record" });
                return;
            }
            if (e.message.includes('Unique constraint')) {
                res.status(409).send({ error: "Conflict with existing record" });
                return;
            }
            if (e.message.includes('Invalid') || e.message.includes('expected')) {
                res.status(400).send({ error: "Invalid data format" });
                return;
            }
        }
        res.status(500).send({ error: "Failed to update reevaluation" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// Delete a reevaluation
routes.delete("/:id", validateKeycloakToken, async function (req, res, _next) {
    try {
        // Check if reevaluation exists
        const existingReevaluation = await prisma.reevaluation.findUnique({
            where: { id: req.params.id }
        });
        if (!existingReevaluation) {
            res.status(404).send({ error: "Reevaluation not found" });
            return;
        }
        // Delete associated image if it exists
        if (existingReevaluation?.sondagePhoto) {
            await deleteImageIfExists(existingReevaluation.sondagePhoto);
        }
        // Delete the reevaluation record
        await prisma.reevaluation.delete({
            where: { id: req.params.id }
        });
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to delete reevaluation" });
    }
    finally {
        await prisma.$disconnect();
    }
});
export default routes;
