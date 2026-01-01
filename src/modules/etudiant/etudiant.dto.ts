import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const createEtudiantSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    niveau: z.string().regex(/^[0-9]+$/),
    pwd: z.string().min(6),
    phone: z.string().optional()
  })
});

export const updateEtudiantSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    username: z.string().min(3).optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    niveau: z.string().regex(/^[0-9]+$/).optional(),
    pwd: z.string().min(6).optional(),
    phone: z.string().optional()
  })
});

export const etudiantIdParamSchema = z.object({
  params: z.object({ id: uuidSchema })
});
