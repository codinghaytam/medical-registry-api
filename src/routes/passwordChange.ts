import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { safeKeycloakConnect, getUserByEmail, validateKeycloakToken } from '../utils/keycloak.js';
import axios from 'axios';
import * as dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

interface PasswordChangeRequestBody {
  currentPassword: string;
  newPassword: string;
}

/**
 * Verify user's current password with Keycloak
 * @param email User's email
 * @param password Current password to verify
 * @returns boolean indicating if password is correct
 */
async function verifyCurrentPassword(email: string, password: string): Promise<boolean> {
  try {
    const tokenUrl = 'https://jellyfish-app-pwtvy.ondigitalocean.app/realms/myRealm/protocol/openid-connect/token';
    
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('client_id', process.env.KEYCLOAK_CLIENT || 'medical-registry');
    params.append('client_secret', process.env.KEYCLOAK_CLIENT_SECRET || 'zw5hWC3WH11PKIcrPEBJanlawTxHg9H8');
    params.append('username', email);
    params.append('password', password);

    const response = await axios.post(tokenUrl, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // If we get a token, the password is correct
    return response.status === 200 && response.data.access_token;
  } catch (error) {
    // If authentication fails, the password is incorrect
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * Change user password by email
 * Route: PUT /password-change/:email
 * Body: { currentPassword: string, newPassword: string }
 */
router.put('/:email', async function(req: Request<{email: string}, {}, PasswordChangeRequestBody>, res: Response, _next: NextFunction): Promise<any> {
  try {
    const { email } = req.params;
    const { currentPassword, newPassword } = req.body;

    // Validate request body
    if (!currentPassword || !newPassword) {
      res.status(400).json({ 
        error: "Both currentPassword and newPassword are required" 
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

    // Verify current password with Keycloak
    const isCurrentPasswordValid = await verifyCurrentPassword(email, currentPassword);
    
    if (!isCurrentPasswordValid) {
      res.status(401).json({ 
        error: "Current password is incorrect" 
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

  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ 
      error: "Failed to change password",
      message: "An internal server error occurred. Please try again later."
    });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
