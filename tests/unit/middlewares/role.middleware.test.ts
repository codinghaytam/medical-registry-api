
import { Request, Response, NextFunction } from 'express';
import { validateRole } from '../../../src/middlewares/role.middleware';
import { Role } from '@prisma/client';
import prisma from '../../../src/lib/prisma';
import { ApiError } from '../../../src/utils/apiError';

// Mock Prisma
jest.mock('../../../src/lib/prisma', () => ({
    __esModule: true,
    default: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));

describe('Role Middleware', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;

    beforeEach(() => {
        req = { user: { email: 'test@example.com' } } as any;
        res = {};
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('should call next with Unauthorized if no user in request', async () => {
        req = {}; // No user
        const middleware = validateRole([Role.ADMIN]);

        await middleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
        // Check if statusCode exists or use simple object matching
        const error = (next as jest.Mock).mock.calls[0][0];
        expect(error.status).toBe(401);
    });

    it('should call next with Unauthorized if user not found in DB', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
        const middleware = validateRole([Role.ADMIN]);

        await middleware(req as Request, res as Response, next);

        expect(prisma.user.findUnique).toHaveBeenCalledWith({
            where: { email: 'test@example.com' },
            select: { role: true, id: true }
        });
        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
        const error = (next as jest.Mock).mock.calls[0][0];
        expect(error.message).toContain('not found');
    });

    it('should call next with Forbidden if user role is not allowed', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: '1', email: 'test@example.com', role: Role.ETUDIANT });
        const middleware = validateRole([Role.ADMIN]);

        await middleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(expect.any(ApiError));
        const error = (next as jest.Mock).mock.calls[0][0];
        expect(error.status).toBe(403);
    });

    it('should call next() and attach dbUser if role is allowed', async () => {
        const mockUser = { id: '1', email: 'test@example.com', role: Role.ADMIN };
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
        const middleware = validateRole([Role.ADMIN]);

        await middleware(req as Request, res as Response, next);

        expect(next).toHaveBeenCalledWith(); // No arguments
        expect((req as any).dbUser).toEqual(mockUser);
    });
});
