import { Prisma, Profession } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class ActionsRepository {
  constructor(private readonly db = prisma) {}

  findAll(tx: PrismaTransaction = this.db) {
    return tx.action.findMany();
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.action.findUnique({ where: { id } });
  }

  create(data: Prisma.ActionCreateInput, tx: PrismaTransaction = this.db) {
    return tx.action.create({ data });
  }

  update(id: string, data: Prisma.ActionUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.action.update({ where: { id }, data });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.action.delete({ where: { id } });
  }

  async setValidity(id: string, isValid: boolean, tx: PrismaTransaction = this.db) {
    return tx.action.update({ where: { id }, data: { isValid } });
  }

  updatePatientState(patientId: string, state: Profession, tx: PrismaTransaction = this.db) {
    return tx.patient.update({ where: { id: patientId }, data: { State: state } });
  }
}
