import { Profession } from '@prisma/client';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const createMedecinSchema = z.object({
  body: z.object({
    username: z.string().min(3),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    profession: z.nativeEnum(Profession),
    isSpecialiste: z.boolean(),
    pwd: z.string().min(6),
    phone: z.string().optional()
  })
});

export const updateMedecinSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    username: z.string().min(3).optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    profession: z.nativeEnum(Profession).optional(),
    isSpecialiste: z.boolean().optional(),
    pwd: z.string().min(6).optional(),
    phone: z.string().optional()
  })
});

export const medecinIdParamSchema = z.object({
  params: z.object({ id: z.string() })
});

export const medecinEmailParamSchema = z.object({
  params: z.object({ email: z.string().email() })
});

export const medecinProfessionParamSchema = z.object({
  params: z.object({ profession: z.nativeEnum(Profession) })
});
