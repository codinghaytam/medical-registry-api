import { Prisma } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class SeanceRepository {
  constructor(private readonly db = prisma) {}

  findAll(tx: PrismaTransaction = this.db) {
    return tx.seance.findMany({
      include: {
        patient: true,
        medecin: {
          include: {
            user: true
          }
        }
      }
    });
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.seance.findUnique({
      where: { id },
      include: {
        patient: true,
        medecin: {
          include: {
            user: true
          }
        }
      }
    });
  }

  create(data: Prisma.SeanceCreateInput, tx: PrismaTransaction = this.db) {
    return tx.seance.create({ data, include: { patient: true, medecin: true } });
  }

  update(id: string, data: Prisma.SeanceUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.seance.update({
      where: { id },
      data,
      include: { patient: true, medecin: true }
    });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.seance.delete({ where: { id } });
  }
}
