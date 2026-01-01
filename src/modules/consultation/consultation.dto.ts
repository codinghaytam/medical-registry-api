import {
  HygieneBuccoDentaire,
  MotifConsultation,
  TypeMastication
} from '@prisma/client';
import { z } from 'zod';

const uuidSchema = z.string().uuid();

const patientSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().min(1),
  adresse: z.string().min(1),
  tel: z.string().min(6),
  numeroDeDossier: z.string().min(1),
  motifConsultation: z.nativeEnum(MotifConsultation),
  anameseGenerale: z.string().optional().nullable(),
  anamneseFamiliale: z.string().optional().nullable(),
  anamneseLocale: z.string().optional().nullable(),
  hygieneBuccoDentaire: z.nativeEnum(HygieneBuccoDentaire),
  typeMastication: z.nativeEnum(TypeMastication),
  antecedentsDentaires: z.string().optional().nullable()
});

export const createConsultationSchema = z.object({
  body: z.object({
    date: z.coerce.date(),
    medecinId: uuidSchema,
    patient: patientSchema
  })
});

export const consultationIdParamSchema = z.object({
  params: z.object({ id: uuidSchema })
});

export const updateConsultationSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    date: z.coerce.date().optional(),
    patient: patientSchema.partial().optional()
  })
});

export const addDiagnosisSchema = z.object({
  params: z.object({ id: uuidSchema }),
  body: z.object({
    type: z.string().min(1),
    text: z.string().min(1),
    medecinId: uuidSchema
  })
});

export const updateDiagnosisSchema = z.object({
  params: z.object({ diagnosisId: uuidSchema }),
  body: z.object({
    type: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    medecinId: uuidSchema.optional()
  })
});
