import type { Express } from 'express';
import { SeanceType } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ReevaluationRepository } from './reevaluation.repository.js';
import { deleteFile } from '../../utils/upload.js';
import { NotificationService } from '../notification/notification.service.js';
import { logger } from '../../utils/logger.js';

interface ReevaluationPayload {
  indiceDePlaque: number;
  indiceGingivale: number;
  patientId: string;
  medecinId: string;
  date: Date;
  type?: string;
}

interface ReevaluationUpdatePayload {
  indiceDePlaque?: number;
  indiceGingivale?: number;
  seanceId?: string;
  removeUploads?: string[];
}

export class ReevaluationService {
  private readonly notificationService: NotificationService;

  constructor(
    private readonly repository = new ReevaluationRepository()
  ) {
    this.notificationService = new NotificationService();
  }

  async list() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const reevaluation = await this.repository.findById(id);
    if (!reevaluation) {
      throw ApiError.notFound('Reevaluation not found');
    }
    return reevaluation;
  }

  async create(payload: ReevaluationPayload, files: Express.Multer.File[] = []) {
    const fileUrls = files.map(f => f.path);

    const result = await prisma.$transaction(async (tx) => {
      const seance = await tx.seance.create({
        data: {
          type: (payload.type ?? 'REEVALUATION') as SeanceType,
          date: payload.date,
          patient: { connect: { id: payload.patientId } },
          medecin: { connect: { id: payload.medecinId } }
        }
      });

      const reevaluation = await this.repository.create(
        {
          indiceDePlaque: payload.indiceDePlaque,
          indiceGingivale: payload.indiceGingivale,
          seance: { connect: { id: seance.id } },
          uploads: fileUrls
        },
        tx
      );

      return { seance, reevaluation };
    });

    // Send notification to the user who performed the re-evaluation?
    // Or to the patient's main doctor? 
    // Requirement: "if someone reeveluates his passionte" -> Notify the doctor who "owns" the patient?

    // We need to find who is "his patient". 
    // For now, let's notify the doctor who passed in medecinId (self-notification for confirmation)
    // AND we should find if there's *another* doctor assigned.

    // Let's get the user ID associated with medecinId
    try {
      const medecin = await prisma.medecin.findUnique({
        where: { id: payload.medecinId },
        select: { userId: true, user: { select: { name: true } } }
      });

      const patient = await prisma.patient.findUnique({
        where: { id: payload.patientId },
        select: { nom: true, prenom: true }
      });

      if (medecin && patient) {
        await this.notificationService.notifyPatientReevaluated(
          medecin.userId,
          payload.patientId,
          `${patient.nom} ${patient.prenom}`,
          medecin.user.name
        );
      }
    } catch (error) {
      logger.error('Failed to send reevaluation notification', { error });
    }

    return result.reevaluation;
  }

  async update(id: string, payload: ReevaluationUpdatePayload, files: Express.Multer.File[] = []) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Reevaluation not found');
    }

    const currentUploads = existing.uploads || [];
    const uploadsToRemove = payload.removeUploads || [];

    // Filter out removed uploads
    const keptUploads = currentUploads.filter(url => !uploadsToRemove.includes(url));

    // Add new uploads
    const newUploads = files.map(f => f.path);
    const finalUploads = [...keptUploads, ...newUploads];

    const result = await this.repository.update(
      id,
      {
        indiceDePlaque: payload.indiceDePlaque,
        indiceGingivale: payload.indiceGingivale,
        seance: payload.seanceId ? { connect: { id: payload.seanceId } } : undefined,
        uploads: finalUploads
      }
    );

    // Delete removed files from storage
    if (uploadsToRemove.length) {
      await Promise.all(uploadsToRemove.map(url => deleteFile(url)));
    }

    return result;
  }

  async remove(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Reevaluation not found');
    }

    await this.repository.delete(id);

    // Delete associated files
    const uploads = existing.uploads || [];
    if (uploads.length) {
      await Promise.all(uploads.map(url => deleteFile(url)));
    }
  }
}
