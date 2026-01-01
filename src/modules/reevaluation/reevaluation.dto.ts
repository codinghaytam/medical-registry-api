import { z } from 'zod';

const uuidSchema = z.string().uuid();

export const createReevaluationSchema = z.object({
  body: z.object({
    indiceDePlaque: z.coerce.number().nonnegative(),
    indiceGingivale: z.coerce.number().nonnegative(),
    patientId: uuidSchema,
    medecinId: uuidSchema,
    date: z.coerce.date(),
    type: z.string().optional()
  })
});

export const updateReevaluationSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    indiceDePlaque: z.coerce.number().nonnegative().optional(),
    indiceGingivale: z.coerce.number().nonnegative().optional(),
    seanceId: uuidSchema.optional()
  })
});

export const reevaluationIdParamSchema = z.object({
  params: z.object({ id: uuidSchema })
});
