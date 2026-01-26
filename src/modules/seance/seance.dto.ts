import { SeanceType } from '@prisma/client';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const createSeanceSchema = z.object({
  body: z.object({
    type: z.nativeEnum(SeanceType),
    autreMotif: z.string().optional(),
    date: z.coerce.date(),
    patientId: uuidSchema,
    medecinId: uuidSchema
  })
});

export const updateSeanceSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    type: z.nativeEnum(SeanceType).optional(),
    autreMotif: z.string().optional(),
    date: z.coerce.date().optional(),
    patientId: uuidSchema.optional(),
    medecinId: uuidSchema.optional()
  })
});

export const seanceIdParamSchema = z.object({
  params: z.object({ id: uuidSchema })
});
