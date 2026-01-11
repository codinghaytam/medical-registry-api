import type { Express } from 'express';
import { SeanceType } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ReevaluationRepository } from './reevaluation.repository.js';
import { deleteFile } from '../../utils/upload.js';

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
  constructor(
    private readonly repository = new ReevaluationRepository()
  ) {}

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

      return this.repository.create(
        {
          indiceDePlaque: payload.indiceDePlaque,
          indiceGingivale: payload.indiceGingivale,
          seance: { connect: { id: seance.id } },
          uploads: fileUrls
        },
        tx
      );
    });

    return result;
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
