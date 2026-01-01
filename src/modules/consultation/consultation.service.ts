import { randomUUID } from 'crypto';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import { DiagnostiqueRepository } from '../diagnostique/diagnostique.repository.js';
import { MedecinRepository } from '../medecin/medecin.repository.js';
import { ConsultationRepository } from './consultation.repository.js';

interface ConsultationPayload {
  date: Date;
  medecinId: string;
  patient: any;
}

interface DiagnosisPayload {
  type: string;
  text: string;
  medecinId: string;
}

export class ConsultationService {
  constructor(
    private readonly repository = new ConsultationRepository(),
    private readonly medecinRepository = new MedecinRepository(),
    private readonly diagnostiqueRepository = new DiagnostiqueRepository()
  ) {}

  list() {
    return this.repository.findAll();
  }

  async getById(id: string) {
    const consultation = await this.repository.findById(id);
    if (!consultation) {
      throw ApiError.notFound('Consultation not found');
    }
    return consultation;
  }

  async create(payload: ConsultationPayload) {
    const medecin = await this.medecinRepository.findById(payload.medecinId);
    if (!medecin) {
      throw ApiError.notFound(`No Medecin record found with ID: ${payload.medecinId}`);
    }

    return this.repository.create({
      date: payload.date,
      idConsultation: randomUUID(),
      patient: {
        create: payload.patient
      },
      medecin: { connect: { id: payload.medecinId } }
    });
  }

  async addDiagnosis(consultationId: string, payload: DiagnosisPayload) {
    const medecin = await this.medecinRepository.findById(payload.medecinId);
    if (!medecin) {
      throw ApiError.notFound(`No Medecin record found with ID: ${payload.medecinId}`);
    }

    const consultation = await this.getById(consultationId);

    if ((consultation.diagnostiques?.length ?? 0) >= 2) {
      throw ApiError.badRequest('No more than 2 diagnoses are allowed for one consultation');
    }

    const hasSameProfession = consultation.diagnostiques?.some((diag) => {
      const profession = diag.Medecin?.profession;
      return profession && profession === medecin.profession;
    });

    if (hasSameProfession) {
      throw ApiError.badRequest(`Only one diagnosis of type ${medecin.profession} is allowed`);
    }

    return this.diagnostiqueRepository.create({
      type: payload.type,
      text: payload.text,
      consultation: { connect: { id: consultationId } },
      Medecin: { connect: { id: payload.medecinId } }
    });
  }

  async update(id: string, payload: { date?: Date; patient?: Record<string, unknown> }) {
    await this.getById(id);
    return this.repository.update(id, {
      date: payload.date,
      patient: payload.patient ? { update: payload.patient } : undefined
    });
  }

  async updateDiagnosis(diagnosisId: string, payload: Partial<DiagnosisPayload>) {
    return this.diagnostiqueRepository.update(diagnosisId, {
      type: payload.type,
      text: payload.text,
      Medecin: payload.medecinId ? { connect: { id: payload.medecinId } } : undefined
    });
  }

  async remove(id: string) {
    return prisma.$transaction(async (tx) => {
      const consultation = await this.repository.findById(id, tx);
      if (!consultation) {
        throw ApiError.notFound('Consultation not found');
      }

      await this.repository.deleteDiagnostiquesByConsultation(id, tx);
      await this.repository.delete(id, tx);
      await this.repository.deletePatient(consultation.patientId, tx);
    });
  }
}
