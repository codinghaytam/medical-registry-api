import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError.js';

/**
 * Middleware to check if the user has one of the required roles.
 * Must be used AFTER validateKeycloakToken/authenticate middleware.
 */
export const requireRole = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = (req as any).user;

        if (!user) {
            return next(ApiError.unauthorized('User not authenticated'));
        }

        const userRoles = user.roles || [];

        // Check if user has at least one of the allowed roles
        const hasPermission = allowedRoles.some(role => userRoles.includes(role));

        if (!hasPermission) {
            return next(ApiError.forbidden(`Insufficient permissions. Required one of: ${allowedRoles.join(', ')}`));
        }

        next();
    };
};
