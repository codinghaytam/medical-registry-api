import prisma from '../../lib/prisma.js';
import { deleteImageIfExists } from '../../utils/upload.js';
import { ApiError } from '../../utils/apiError.js';
import { ReevaluationRepository } from './reevaluation.repository.js';

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
}

export class ReevaluationService {
  constructor(private readonly repository = new ReevaluationRepository()) {}

  private withImageUrl(record: any) {
    return {
      ...record,
      sondagePhoto: record.sondagePhoto ? `/uploads/${record.sondagePhoto}` : null
    };
  }

  async list() {
    const reevaluations = await this.repository.findAll();
    return reevaluations.map((record) => this.withImageUrl(record));
  }

  async getById(id: string) {
    const reevaluation = await this.repository.findById(id);
    if (!reevaluation) {
      throw ApiError.notFound('Reevaluation not found');
    }
    return this.withImageUrl(reevaluation);
  }

  async create(payload: ReevaluationPayload, imageFilename?: string) {
    const result = await prisma.$transaction(async (tx) => {
      const seance = await tx.seance.create({
        data: {
          type: payload.type ?? 'REEVALUATION',
          date: payload.date,
          patient: { connect: { id: payload.patientId } },
          medecin: { connect: { id: payload.medecinId } }
        }
      });

      const reevaluation = await this.repository.create(
        {
          indiceDePlaque: payload.indiceDePlaque,
          indiceGingivale: payload.indiceGingivale,
          sondagePhoto: imageFilename,
          seance: { connect: { id: seance.id } }
        },
        tx
      );

      return reevaluation;
    });

    return this.withImageUrl(result);
  }

  async update(id: string, payload: ReevaluationUpdatePayload, imageFilename?: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Reevaluation not found');
    }

    let nextImage = existing.sondagePhoto;
    if (imageFilename) {
      await deleteImageIfExists(existing.sondagePhoto ?? null);
      nextImage = imageFilename;
    }

    const updated = await this.repository.update(id, {
      indiceDePlaque: payload.indiceDePlaque,
      indiceGingivale: payload.indiceGingivale,
      sondagePhoto: nextImage,
      seance: payload.seanceId ? { connect: { id: payload.seanceId } } : undefined
    });

    return this.withImageUrl(updated);
  }

  async remove(id: string) {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw ApiError.notFound('Reevaluation not found');
    }

    await deleteImageIfExists(existing.sondagePhoto ?? null);
    await this.repository.delete(id);
  }
}
