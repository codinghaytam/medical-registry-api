import {
  HygieneBuccoDentaire,
  MotifConsultation,
  TypeMastication
} from '@prisma/client';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

const patientBaseSchema = z.object({
  nom: z.string().min(1),
  numeroDeDossier: z.string().min(1),
  prenom: z.string().min(1),
  adresse: z.string().min(1),
  tel: z.string().min(6),
  motifConsultation: z.nativeEnum(MotifConsultation),
  anameseGenerale: z.string().optional().nullable(),
  anamneseFamiliale: z.string().optional().nullable(),
  anamneseLocale: z.string().optional().nullable(),
  hygieneBuccoDentaire: z.nativeEnum(HygieneBuccoDentaire),
  typeMastication: z.nativeEnum(TypeMastication),
  antecedentsDentaires: z.string().optional().nullable()
});

export const createPatientSchema = z.object({
  body: patientBaseSchema
});

export const updatePatientSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: patientBaseSchema.partial().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field must be provided'
  })
});

export const patientIdParamSchema = z.object({
  params: z.object({ id: uuidSchema })
});

export const transferSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({ medecinId: uuidSchema })
});

export const validateTransferSchema = z.object({
  params: z.object({ actionId: uuidSchema })
});
