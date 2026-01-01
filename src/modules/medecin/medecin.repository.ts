import { Prisma, Profession } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class MedecinRepository {
  constructor(private readonly db = prisma) {}

  findAll(tx: PrismaTransaction = this.db) {
    return tx.medecin.findMany({ include: { user: true } });
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.medecin.findUnique({ where: { id }, include: { user: true } });
  }

  findByUserId(userId: string, tx: PrismaTransaction = this.db) {
    return tx.medecin.findUnique({ where: { userId }, include: { user: true } });
  }

  findByEmail(email: string, tx: PrismaTransaction = this.db) {
    return tx.medecin.findFirst({
      where: { user: { email } },
      include: { user: true }
    });
  }

  findByProfession(profession: Profession, tx: PrismaTransaction = this.db) {
    return tx.medecin.findMany({ where: { profession }, include: { user: true } });
  }

  create(data: Prisma.MedecinCreateInput, tx: PrismaTransaction = this.db) {
    return tx.medecin.create({ data, include: { user: true } });
  }

  update(id: string, data: Prisma.MedecinUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.medecin.update({ where: { id }, data, include: { user: true } });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.medecin.delete({ where: { id } });
  }
}
