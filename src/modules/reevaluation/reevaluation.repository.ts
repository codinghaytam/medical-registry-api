import { Prisma } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class ReevaluationRepository {
  constructor(private readonly db = prisma) {}

  findAll(tx: PrismaTransaction = this.db) {
    return tx.reevaluation.findMany({
      include: {
        seance: {
          include: {
            patient: true,
            medecin: {
              include: {
                user: true
              }
            },
            Reevaluation: true
          }
        }
      }
    });
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.reevaluation.findUnique({
      where: { id },
      include: {
        seance: {
          include: {
            patient: true,
            medecin: {
              include: {
                user: true
              }
            },
            Reevaluation: true
          }
        }
      }
    });
  }

  create(data: Prisma.ReevaluationCreateInput, tx: PrismaTransaction = this.db) {
    return tx.reevaluation.create({
      data,
      include: {
        seance: {
          include: {
            patient: true,
            medecin: {
              include: { user: true }
            }
          }
        }
      }
    });
  }

  update(id: string, data: Prisma.ReevaluationUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.reevaluation.update({
      where: { id },
      data,
      include: {
        seance: {
          include: {
            patient: true,
            medecin: {
              include: { user: true }
            }
          }
        }
      }
    });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.reevaluation.delete({ where: { id } });
  }
}
