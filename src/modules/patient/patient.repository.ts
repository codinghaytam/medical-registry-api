import { Prisma, Profession } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class PatientRepository {
  constructor(private readonly db = prisma) { }

  findAll(tx: PrismaTransaction = this.db) {
    return tx.patient.findMany();
  }

  findAllByState(state: Profession, tx: PrismaTransaction = this.db) {
    return tx.patient.findMany({ where: { State: state } });
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.patient.findUnique({ where: { id } });
  }

  create(data: Prisma.PatientCreateInput, tx: PrismaTransaction = this.db) {
    return tx.patient.create({ data });
  }

  update(id: string, data: Prisma.PatientUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.patient.update({ where: { id }, data });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.patient.delete({ where: { id } });
  }

  updateState(id: string, state: Profession, tx: PrismaTransaction = this.db) {
    return tx.patient.update({ where: { id }, data: { State: state } });
  }
}
