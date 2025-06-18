import express from 'express';
import { PrismaClient, Profession, Role } from '@prisma/client';
import * as dotenv from "dotenv";
import { connectToKeycloak } from '../utils/keycloak.js';
import { validatePhone } from '../utils/validation.js';
dotenv.config();
let kcAdminClient;
const router = express.Router();
const prisma = new PrismaClient();
// Helper function to get Keycloak user info
// POST create a new medic
router.post('/', validatePhone, async function (req, res, _next) {
    try {
        // Validate profession
        if (!(req.body.profession in Profession)) {
            return res.status(400).send("Invalid profession");
        }
        // Create user in Keycloak
        kcAdminClient = await connectToKeycloak();
        const kcUser = await kcAdminClient.users.create({
            username: req.body.username,
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            enabled: true,
            credentials: [
                {
                    type: "password",
                    value: req.body.pwd,
                    temporary: false
                }
            ],
            attributes: {
                // Include phone number as an attribute if provided
                ...(req.body.phone ? { phoneNumber: [req.body.phone] } : {})
            }
        });
        // Create user in database
        const user = await prisma.user.create({
            data: {
                username: req.body.username,
                name: req.body.firstName + " " + req.body.lastName,
                email: req.body.email,
                role: Role.MEDECIN,
                // @ts-ignore - phone field exists in the schema but might not be recognized by the TypeScript compiler
                phone: req.body.phone || "",
            }
        });
        // Create medic
        const medic = await prisma.medecin.create({
            data: {
                profession: req.body.profession,
                isSpecialiste: req.body.isSpecialiste,
                userId: user.id,
            }
        });
        res.status(201).send(medic);
    }
    catch (error) {
        console.error('Error creating medic:', error);
        await prisma.$disconnect();
        res.status(500).send({ error: "Failed to create medic" });
    }
});
// GET all medecins
router.get('/', async function (_req, res, _next) {
    try {
        const medecins = await prisma.medecin.findMany({
            include: {
                user: true
            }
        });
        res.status(200).send(medecins);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch medecins" });
    }
    finally {
        await prisma.$disconnect();
    }
});
router.get('/profession/:profession', async function (req, res, _next) {
    try {
        if (req.params.profession in Profession) {
            const medecins = await prisma.medecin.findMany({
                include: {
                    user: true
                },
                where: { profession: req.params.profession }
            });
            res.status(200).send(medecins);
        }
        else {
            res.status(400).send("invalid profession");
        }
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch medecins" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// GET a specific medecin
router.get('/:id', async function (req, res, _next) {
    try {
        const medecin = await prisma.medecin.findUnique({
            where: { id: req.params.id },
            include: {
                user: true
            }
        });
        if (!medecin) {
            return res.status(404).send({ error: "Medecin not found" });
        }
        res.status(200).send(medecin);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch medecin" });
    }
    finally {
        await prisma.$disconnect();
    }
});
router.get('/email/:email', async function (req, res, _next) {
    try {
        const medecin = await prisma.medecin.findFirst({
            where: { user: {
                    email: req.params.email
                } },
            include: {
                user: true
            }
        });
        if (!medecin) {
            return res.status(404).send({ error: "Medecin not found" });
        }
        res.status(200).send(medecin);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch medecin" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// POST a new medecin
router.post('/', validatePhone, async function (req, res, _next) {
    try {
        if (!(req.body.profession in Profession)) {
            return res.status(400).send("invalid profession");
        }
        // Create Keycloak user
        kcAdminClient = await connectToKeycloak();
        const kcUser = await kcAdminClient.users.create({
            username: req.body.username,
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            enabled: true,
            credentials: [{ type: 'password', value: req.body.pwd, temporary: false }],
        });
        // Create local user and medecin
        const newUser = await prisma.user.create({
            data: {
                email: req.body.email,
                username: req.body.username,
                name: req.body.firstName + " " + req.body.lastName,
                role: 'MEDECIN',
                // @ts-ignore - phone field exists in the schema but might not be recognized by the TypeScript compiler
                phone: req.body.phone || "",
            }
        });
        const newMedecin = await prisma.medecin.create({
            data: {
                profession: req.body.profession,
                isSpecialiste: req.body.isSpecialiste,
                userId: newUser.id
            },
            include: {
                user: true
            }
        });
        res.status(201).json(newMedecin);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to create medecin and user: " + e });
    }
    finally {
        await prisma.$disconnect();
    }
});
// PUT to update a specific medecin
router.put('/:id', validatePhone, async function (req, res, _next) {
    try {
        if (req.body.profession && !(req.body.profession in Profession)) {
            return res.status(400).send("invalid profession");
        }
        // Update Keycloak user
        kcAdminClient = await connectToKeycloak();
        const medecin = await prisma.medecin.findUnique({
            where: { id: req.params.id },
            include: { user: true }
        });
        if (!medecin) {
            return res.status(404).send({ error: "Medecin not found" });
        }
        const users = await kcAdminClient.users.find({ email: medecin.user.email });
        if (users && users[0] && users[0].id) {
            await kcAdminClient.users.update({ id: users[0].id }, { email: req.body.email, username: req.body.username });
        }
        // Update local user and medecin
        const updatedUser = await prisma.user.update({
            where: { id: medecin.userId },
            data: {
                email: req.body.email,
                username: req.body.username,
                name: req.body.firstName && req.body.lastName ? `${req.body.firstName} ${req.body.lastName}` : medecin.user.name,
                // Only include phone if it was provided in the request
                ...(req.body.phone !== undefined ? { phone: req.body.phone } : {})
            }
        });
        const updatedMedecin = await prisma.medecin.update({
            where: { id: medecin.id },
            data: {
                profession: req.body.profession,
                isSpecialiste: req.body.isSpecialiste
            },
            include: {
                user: true
            }
        });
        res.status(200).send(updatedMedecin);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to update medecin" });
    }
    finally {
        await prisma.$disconnect();
    }
});
// DELETE a specific medecin
router.delete('/:id', async function (req, res, _next) {
    try {
        const medecin = await prisma.medecin.findUnique({
            where: { userId: req.params.id },
            include: { user: true }
        });
        if (!medecin) {
            return res.status(404).send({ error: "Medecin not found" });
        }
        if (!(medecin.profession in Profession)) {
            return res.status(400).send("invalid profession");
        }
        // Delete from local DB
        await prisma.medecin.delete({ where: { id: medecin.id } });
        await prisma.user.delete({ where: { id: medecin.userId } });
        // Delete from Keycloak
        kcAdminClient = await connectToKeycloak();
        const users = await kcAdminClient.users.find({ email: medecin.user.email });
        if (users && users[0].id) {
            await kcAdminClient.users.del({ id: users[0].id });
        }
        else {
            res.status(400).send("bad argument id");
        }
        res.status(204).send();
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to delete medecin" });
    }
    finally {
        await prisma.$disconnect();
    }
});
export default router;
