import { Role } from '@prisma/client';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phone: z.string().optional(),
    role: z.nativeEnum(Role),
    pwd: z.string().min(6)
  })
});

export const updateUserSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phone: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    pwd: z.string().min(6).optional()
  })
});

export const userIdParamSchema = z.object({
  params: z.object({ id: uuidSchema })
});

export const userEmailParamSchema = z.object({
  params: z.object({ email: z.string().email() })
});

export const userRoleParamSchema = z.object({
  params: z.object({ role: z.nativeEnum(Role) })
});
