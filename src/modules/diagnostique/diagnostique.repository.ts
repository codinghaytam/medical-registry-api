import { Prisma } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class DiagnostiqueRepository {
  constructor(private readonly db = prisma) {}

  findAll(tx: PrismaTransaction = this.db) {
    return tx.diagnostique.findMany({
      include: {
        Medecin: {
          include: {
            user: true
          }
        }
      }
    });
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.diagnostique.findUnique({
      where: { id },
      include: {
        Medecin: {
          include: { user: true }
        }
      }
    });
  }

  create(data: Prisma.DiagnostiqueCreateInput, tx: PrismaTransaction = this.db) {
    return tx.diagnostique.create({ data });
  }

  update(id: string, data: Prisma.DiagnostiqueUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.diagnostique.update({ where: { id }, data });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.diagnostique.delete({ where: { id } });
  }
}
