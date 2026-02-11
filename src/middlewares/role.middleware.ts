import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { ApiError } from '../utils/apiError.js';
import prisma from '../lib/prisma.js';

/**
 * Middleware to validate user role against the database.
 * This MUST be used after `validateKeycloakToken`.
 * 
 * @param allowedRoles Array of roles that are allowed to access the route
 */
export const validateRole = (allowedRoles: Role[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1. Check if user is authenticated (req.user populated by validateKeycloakToken)
            const keycloakUser = (req as any).user;

            if (!keycloakUser || !keycloakUser.email) {
                return next(ApiError.unauthorized('User not authenticated or email missing from token'));
            }

            // 2. Fetch user verified role from Database
            // We do NOT trust the token role alone, we verify against our source of truth
            const user = await prisma.user.findUnique({
                where: { email: keycloakUser.email },
                select: { role: true, id: true }
            });

            if (!user) {
                return next(ApiError.unauthorized('User not found in system records'));
            }

            // 3. Check if user has required role
            if (!allowedRoles.includes(user.role)) {
                return next(ApiError.forbidden(`Access denied. Required role: ${allowedRoles.join(' or ')}`));
            }

            // 4. Attach the verified dbUser to request for convenience
            (req as any).dbUser = user;

            next();
        } catch (error) {
            console.error('Role validation error:', error);
            next(ApiError.internal('Role validation failed'));
        }
    };
};
