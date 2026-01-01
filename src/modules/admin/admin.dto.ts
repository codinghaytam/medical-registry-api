import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const createAdminSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    pwd: z.string().min(6).optional()
  })
});

export const updateAdminSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    pwd: z.string().min(6).optional()
  })
});

export const adminIdParamSchema = z.object({
  params: z.object({ id: z.string() })
});

export const adminEmailParamSchema = z.object({
  params: z.object({ email: z.string().email() })
});
