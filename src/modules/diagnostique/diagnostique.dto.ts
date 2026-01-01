import { z } from 'zod';

const uuidSchema = z.string().uuid();

const baseDiagnostiqueSchema = z.object({
  type: z.string().min(1),
  text: z.string().min(1),
  consultationId: uuidSchema,
  medecinId: uuidSchema.optional()
});

export const createDiagnostiqueSchema = z.object({
  body: baseDiagnostiqueSchema
});

export const updateDiagnostiqueSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: baseDiagnostiqueSchema.partial().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided'
  })
});

export const diagnostiqueIdParamSchema = z.object({
  params: z.object({ id: uuidSchema })
});
