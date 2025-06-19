import express from 'express';
import { PrismaClient } from '@prisma/client';
import { safeKeycloakConnect, getUserByEmail } from '../utils/keycloak.js';
import * as dotenv from "dotenv";
dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();
/**
 * Change user password by email
 * Route: PUT /password-change/:email
 * Body: { newPassword: string }
 */
router.put('/:email', async function (req, res, _next) {
    try {
        const { email } = req.params;
        const { newPassword } = req.body;
        // Validate request body
        if (!newPassword) {
            res.status(400).json({
                error: "newPassword is required"
            });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({
                error: "New password must be at least 6 characters long"
            });
            return;
        }
        // Check if user exists in database
        const dbUser = await prisma.user.findUnique({
            where: { email: email }
        });
        if (!dbUser) {
            res.status(404).json({
                error: "User not found"
            });
            return;
        }
        // Connect to Keycloak Admin Client
        const kc = await safeKeycloakConnect(res);
        if (!kc) {
            return;
        }
        // Get Keycloak user
        const kcUser = await getUserByEmail(email, res);
        if (!kcUser || !kcUser.id) {
            res.status(404).json({
                error: "User not found in Keycloak"
            });
            return;
        }
        // Update password in Keycloak
        await kc.users.resetPassword({
            id: kcUser.id,
            credential: {
                type: 'password',
                value: newPassword,
                temporary: false
            }
        });
        res.status(200).json({
            message: "Password changed successfully",
            userId: dbUser.id,
            email: email
        });
    }
    catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            error: "Failed to change password",
            message: "An internal server error occurred. Please try again later."
        });
    }
    finally {
        await prisma.$disconnect();
    }
});
export default router;
