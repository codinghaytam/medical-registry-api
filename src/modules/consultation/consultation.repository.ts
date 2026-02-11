import { Prisma } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class ConsultationRepository {
  constructor(private readonly db = prisma) { }

  findAll(tx: PrismaTransaction = this.db) {
    return tx.consultation.findMany({
      include: {
        patient: true,
        medecin: { include: { user: true } },
        diagnostiques: {
          include: {
            Medecin: {
              include: { user: true }
            }
          }
        }
      }
    });
  }

  findAllByMedecinId(medecinId: string, tx: PrismaTransaction = this.db) {
    return tx.consultation.findMany({
      where: { medecinId },
      include: {
        patient: true,
        medecin: { include: { user: true } },
        diagnostiques: {
          include: {
            Medecin: {
              include: { user: true }
            }
          }
        }
      }
    });
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.consultation.findUnique({
      where: { id },
      include: {
        patient: true,
        medecin: { include: { user: true } },
        diagnostiques: {
          include: {
            Medecin: {
              include: { user: true }
            }
          }
        }
      }
    });
  }

  create(data: Prisma.ConsultationCreateInput, tx: PrismaTransaction = this.db) {
    return tx.consultation.create({ data, include: { patient: true, medecin: true } });
  }

  update(id: string, data: Prisma.ConsultationUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.consultation.update({
      where: { id },
      data,
      include: { patient: true, medecin: true }
    });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.consultation.delete({ where: { id } });
  }

  deleteDiagnostiquesByConsultation(consultationId: string, tx: PrismaTransaction = this.db) {
    return tx.diagnostique.deleteMany({ where: { consultationId } });
  }

  deletePatient(patientId: string, tx: PrismaTransaction = this.db) {
    return tx.patient.delete({ where: { id: patientId } });
  }
}
