import type { Express } from 'express';
import { unlink } from 'fs/promises';
import { SeanceType } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { ReevaluationRepository } from './reevaluation.repository.js';
import { UploadRepository } from './upload.repository.js';

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
  removeUploadIds?: string[];
}

export class ReevaluationService {
  constructor(
    private readonly repository = new ReevaluationRepository(),
    private readonly uploadRepository = new UploadRepository()
  ) {}

  private withUploads(record: any) {
    if (!record) {
      return record;
    }

    const uploads = Array.isArray(record.uploads)
      ? record.uploads.map((upload: any) => ({
          ...upload,
          url: `/uploads/${upload.filename}`
        }))
      : [];

    return {
      ...record,
      uploads
    };
  }

  private mapFilesToUploadInput(files: Express.Multer.File[], reevaluationId: string) {
    return files.map((file) => ({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      path: file.path,
      reevaluationId
    }));
  }

  private async deleteUploadFiles(uploads: { path?: string }[]) {
    await Promise.all(
      uploads.map(async (upload) => {
        if (!upload.path) {
          return;
        }

        try {
          await unlink(upload.path);
        } catch (error) {
          console.warn(`Failed to delete upload ${upload.path}`, error);
        }
      })
    );
  }

  async list() {
    const reevaluations = await this.repository.findAll();
    return reevaluations.map((record) => this.withUploads(record));
  }

  async getById(id: string) {
    const reevaluation = await this.repository.findById(id);
    if (!reevaluation) {
      throw ApiError.notFound('Reevaluation not found');
    }
    return this.withUploads(reevaluation);
  }

  async create(payload: ReevaluationPayload, files: Express.Multer.File[] = []) {
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
          seance: { connect: { id: seance.id } }
        },
        tx
      );

      if (files.length) {
        await this.uploadRepository.createMany(this.mapFilesToUploadInput(files, reevaluation.id), tx);
      }

      return this.repository.findById(reevaluation.id, tx);
    });

    return this.withUploads(result);
  }

  async update(id: string, payload: ReevaluationUpdatePayload, files: Express.Multer.File[] = []) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Reevaluation not found');
    }

    const currentUploads = Array.isArray(existing.uploads) ? existing.uploads : [];
    const uploadsToRemove = payload.removeUploadIds?.length
      ? currentUploads.filter((upload: any) => payload.removeUploadIds?.includes(upload.id))
      : [];

    const updated = await prisma.$transaction(async (tx) => {
      if (uploadsToRemove.length) {
        await this.uploadRepository.deleteByIds(uploadsToRemove.map((upload) => upload.id), tx);
      }

      const reevaluation = await this.repository.update(
        id,
        {
          indiceDePlaque: payload.indiceDePlaque,
          indiceGingivale: payload.indiceGingivale,
          seance: payload.seanceId ? { connect: { id: payload.seanceId } } : undefined
        },
        tx
      );

      if (files.length) {
        await this.uploadRepository.createMany(this.mapFilesToUploadInput(files, reevaluation.id), tx);
      }

      return this.repository.findById(id, tx);
    });

    if (uploadsToRemove.length) {
      await this.deleteUploadFiles(uploadsToRemove);
    }

    return this.withUploads(updated);
  }

  async remove(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Reevaluation not found');
    }

    await prisma.$transaction(async (tx) => {
      const currentUploads = Array.isArray(existing.uploads) ? existing.uploads : [];
      if (currentUploads.length) {
        await this.uploadRepository.deleteByIds(currentUploads.map((upload: any) => upload.id), tx);
      }
      await this.repository.delete(id, tx);
    });

    const uploads = Array.isArray(existing.uploads) ? existing.uploads : [];
    if (uploads.length) {
      await this.deleteUploadFiles(uploads);
    }
  }
}
