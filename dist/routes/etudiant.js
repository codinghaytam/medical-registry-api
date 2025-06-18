'use strict';
import express from 'express';
import { PrismaClient, Role } from '@prisma/client';
import { connectToKeycloak } from '../utils/keycloak.js';
import { validatePhone } from '../utils/validation.js';
const router = express.Router();
const prisma = new PrismaClient();
router.get('/', async function (_req, res, _next) {
    try {
        const etudiants = await prisma.etudiant.findMany({
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        name: true
                    }
                }
            }
        });
        res.status(200).send(etudiants);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch etudiants" });
    }
    finally {
        await prisma.$disconnect();
    }
});
router.get('/:id', async function (req, res, _next) {
    try {
        const etudiant = await prisma.etudiant.findUnique({
            where: { id: req.params.id },
            include: {
                user: {
                    select: {
                        username: true,
                        email: true,
                        name: true
                    }
                }
            }
        });
        if (!etudiant) {
            res.status(404).send({ error: "Etudiant not found" });
            return;
        }
        res.status(200).send(etudiant);
    }
    catch (e) {
        console.error(e);
        res.status(500).send({ error: "Failed to fetch etudiant" });
    }
    finally {
        await prisma.$disconnect();
    }
});
router.post('/', validatePhone, async function (req, res, _next) {
    try {
        const kcAdminClient = await connectToKeycloak();
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
        // Create user first
        const user = await prisma.user.create({
            data: {
                username: req.body.username,
                email: req.body.email,
                name: `${req.body.firstName} ${req.body.lastName}`,
                role: Role.ETUDIANT,
                // @ts-ignore - phone field exists in the schema but might not be recognized by the TypeScript compiler
                phone: req.body.phone || "",
            }
        });
        // Create etudiant and link to user
        const newEtudiant = await prisma.etudiant.create({
            data: {
                userId: user.id,
                niveau: parseInt(req.body.niveau)
            }
        });
        res.status(201).send(newEtudiant);
    }
    catch (e) {
        console.log(e);
        res.status(500).send({ error: "Failed to create etudiant and Keycloak user: " + e });
    }
    finally {
        await prisma.$disconnect();
    }
});
router.put('/:id', validatePhone, async function (req, res, _next) {
    try {
        // Get the existing etudiant and user
        const etudiant = await prisma.etudiant.findUnique({
            where: { id: req.params.id },
            include: {
                user: true
            }
        });
        if (!etudiant) {
            res.status(404).send({ error: "Etudiant not found" });
            return;
        }
        const kcAdminClient = await connectToKeycloak();
        // Update Keycloak user
        await kcAdminClient.users.update({ id: etudiant.user.id }, {
            username: req.body.username || etudiant.user.username,
            email: req.body.email || etudiant.user.email,
            firstName: req.body.firstName || etudiant.user.name.split(' ')[0],
            lastName: req.body.lastName || etudiant.user.name.split(' ')[1],
            enabled: true
        });
        // If password is provided, update it in Keycloak
        if (req.body.pwd) {
            await kcAdminClient.users.resetPassword({
                id: etudiant.user.id,
                credential: {
                    type: "password",
                    value: req.body.pwd,
                    temporary: false
                }
            });
        }
        // Update Prisma records - first update the User
        const updatedUser = await prisma.user.update({
            where: { id: etudiant.user.id },
            data: {
                username: req.body.username || etudiant.user.username,
                email: req.body.email || etudiant.user.email,
                name: req.body.firstName && req.body.lastName
                    ? `${req.body.firstName} ${req.body.lastName}`
                    : etudiant.user.name,
                // Only include phone if it was provided in the request
                ...(req.body.phone !== undefined ? { phone: req.body.phone } : {})
            }
        });
        // Then update the Etudiant
        const updatedEtudiant = await prisma.etudiant.update({
            where: { id: etudiant.id },
            data: {
                niveau: req.body.niveau ? parseInt(req.body.niveau) : undefined
            },
            include: {
                user: true
            }
        });
        res.status(200).json({
            message: "Etudiant updated successfully",
            data: updatedEtudiant
        });
    }
    catch (e) {
        console.error('Error updating etudiant:', e);
        res.status(500).json({ error: 'Failed to update etudiant and Keycloak user' });
    }
});
router.delete('/:id', async function (req, res, _next) {
    try {
        // First get the etudiant and user
        const etudiant = await prisma.etudiant.findUnique({
            where: { userId: req.params.id },
            include: {
                user: true
            }
        });
        if (!etudiant) {
            res.status(404).send({ error: "Etudiant not found" });
            return;
        }
        // Delete from Keycloak first
        const kcAdminClient = await connectToKeycloak();
        const KcUsertoDelete = await kcAdminClient.users.find({ email: etudiant.user.email });
        await kcAdminClient.users.del({ id: KcUsertoDelete[0].id || '' });
        // Then delete from Prisma
        await prisma.etudiant.delete({
            where: { id: etudiant.id }
        });
        await prisma.user.delete({
            where: { id: etudiant.userId }
        });
        res.status(204).send();
    }
    catch (e) {
        console.error('Error deleting etudiant:', e);
        res.status(500).json({ error: 'Failed to delete etudiant and Keycloak user' });
    }
});
export default router;
