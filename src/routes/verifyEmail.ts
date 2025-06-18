import express, { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { safeKeycloakConnect, getUserByEmail, validateKeycloakToken } from '../utils/keycloak.js';
import * as dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

interface EmailVerificationRequestBody {
  redirectUri?: string;
  clientId?: string;
}

/**
 * Send email verification to user
 * Route: POST /verify-email/:email
 * Body: { redirectUri?: string, clientId?: string }
 */
router.post('/:email', async function(req: Request<{email: string}, {}, EmailVerificationRequestBody>, res: Response, _next: NextFunction): Promise<any> {
  try {
    const { email } = req.params;
    const { redirectUri, clientId } = req.body || {};

    // Validate email parameter
    if (!email) {
      res.status(400).json({ 
        error: "Email is required as URL parameter" 
      });
      return;
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!dbUser) {
      res.status(404).json({ 
        error: "User not found in database" 
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

    // Check if email is already verified
    if (kcUser.emailVerified) {
      res.status(200).json({
        message: "Email is already verified",
        userId: dbUser.id,
        email: email,
        emailVerified: true
      });
      return;
    }

    // Send verification email through Keycloak
    const emailVerificationParams: any = {};
    
    if (redirectUri) {
      emailVerificationParams.redirectUri = redirectUri;
    }
    
    if (clientId) {
      emailVerificationParams.clientId = clientId;
    }

    await kc.users.sendVerifyEmail({
      id: kcUser.id,
      ...emailVerificationParams
    });

    res.status(200).json({
      message: "Email verification sent successfully",
      userId: dbUser.id,
      email: email,
      emailVerified: false
    });

  } catch (error) {
    console.error('Error sending email verification:', error);
    res.status(500).json({ 
      error: "Failed to send email verification",
      message: "An internal server error occurred. Please try again later."
    });
  } finally {
    await prisma.$disconnect();
  }
});

/**
 * Check email verification status
 * Route: GET /verify-email/:email/status
 */
router.get('/:email/status', async function(req: Request<{email: string}>, res: Response, _next: NextFunction): Promise<any> {
  try {
    const { email } = req.params;

    // Validate email parameter
    if (!email) {
      res.status(400).json({ 
        error: "Email is required as URL parameter" 
      });
      return;
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!dbUser) {
      res.status(404).json({ 
        error: "User not found in database" 
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

    res.status(200).json({
      userId: dbUser.id,
      email: email,
      emailVerified: kcUser.emailVerified || false,
      userEnabled: kcUser.enabled || false
    });

  } catch (error) {
    console.error('Error checking email verification status:', error);
    res.status(500).json({ 
      error: "Failed to check email verification status",
      message: "An internal server error occurred. Please try again later."
    });
  } finally {
    await prisma.$disconnect();
  }
});

/**
 * Resend email verification
 * Route: PUT /verify-email/:email/resend
 * Body: { redirectUri?: string, clientId?: string }
 */
router.put('/:email/resend', async function(req: Request<{email: string}, {}, EmailVerificationRequestBody>, res: Response, _next: NextFunction): Promise<any> {
  try {
    const { email } = req.params;
    const { redirectUri, clientId } = req.body || {};

    // Validate email parameter
    if (!email) {
      res.status(400).json({ 
        error: "Email is required as URL parameter" 
      });
      return;
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!dbUser) {
      res.status(404).json({ 
        error: "User not found in database" 
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

    // Check if email is already verified
    if (kcUser.emailVerified) {
      res.status(200).json({
        message: "Email is already verified",
        userId: dbUser.id,
        email: email,
        emailVerified: true
      });
      return;
    }

    // Resend verification email through Keycloak
    const emailVerificationParams: any = {};
    
    if (redirectUri) {
      emailVerificationParams.redirectUri = redirectUri;
    }
    
    if (clientId) {
      emailVerificationParams.clientId = clientId;
    }

    await kc.users.sendVerifyEmail({
      id: kcUser.id,
      ...emailVerificationParams
    });

    res.status(200).json({
      message: "Email verification resent successfully",
      userId: dbUser.id,
      email: email,
      emailVerified: false
    });

  } catch (error) {
    console.error('Error resending email verification:', error);
    res.status(500).json({ 
      error: "Failed to resend email verification",
      message: "An internal server error occurred. Please try again later."
    });
  } finally {
    await prisma.$disconnect();
  }
});

/**
 * Mark email as verified manually (admin only)
 * Route: PUT /verify-email/:email/mark-verified
 */
router.put('/:email/mark-verified', validateKeycloakToken, async function(req: Request<{email: string}>, res: Response, _next: NextFunction): Promise<any> {
  try {
    const { email } = req.params;

    // Validate email parameter
    if (!email) {
      res.status(400).json({ 
        error: "Email is required as URL parameter" 
      });
      return;
    }

    // Check if user exists in database
    const dbUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (!dbUser) {
      res.status(404).json({ 
        error: "User not found in database" 
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

    // Update email verification status in Keycloak
    await kc.users.update({
      id: kcUser.id
    }, {
      emailVerified: true
    });

    res.status(200).json({
      message: "Email marked as verified successfully",
      userId: dbUser.id,
      email: email,
      emailVerified: true
    });

  } catch (error) {
    console.error('Error marking email as verified:', error);
    res.status(500).json({ 
      error: "Failed to mark email as verified",
      message: "An internal server error occurred. Please try again later."
    });
  } finally {
    await prisma.$disconnect();
  }
});

export default router;
