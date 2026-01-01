import { ActionType } from '@prisma/client';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

const baseActionSchema = z.object({
  type: z.nativeEnum(ActionType),
  date: z.coerce.date(),
  medecinId: uuidSchema,
  patientId: uuidSchema,
  isValid: z.boolean().optional()
});

export const createActionSchema = z.object({
  body: baseActionSchema
});

export const updateActionSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: baseActionSchema.partial().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided'
  })
});

export const actionIdParamSchema = z.object({
  params: z.object({ id: uuidSchema })
});
