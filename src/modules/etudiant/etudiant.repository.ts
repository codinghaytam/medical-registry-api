import { Prisma } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class EtudiantRepository {
  constructor(private readonly db = prisma) {}

  findAll(tx: PrismaTransaction = this.db) {
    return tx.etudiant.findMany({
      include: {
        user: {
          select: {
            username: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.etudiant.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            username: true,
            email: true,
            name: true
          }
        }
      }
    });
  }

  findByUserId(userId: string, tx: PrismaTransaction = this.db) {
    return tx.etudiant.findUnique({ where: { userId }, include: { user: true } });
  }

  create(data: Prisma.EtudiantCreateInput, tx: PrismaTransaction = this.db) {
    return tx.etudiant.create({ data });
  }

  update(id: string, data: Prisma.EtudiantUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.etudiant.update({ where: { id }, data, include: { user: true } });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.etudiant.delete({ where: { id } });
  }
}
