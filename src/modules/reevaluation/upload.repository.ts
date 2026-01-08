import { Prisma } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class UploadRepository {
  constructor(private readonly db = prisma) {}

  createMany(data: Prisma.UploadCreateManyInput[], tx: PrismaTransaction = this.db) {
    if (!data.length) {
      return Promise.resolve({ count: 0 });
    }

    return tx.upload.createMany({ data });
  }

  findByIds(ids: string[], tx: PrismaTransaction = this.db) {
    if (!ids.length) {
      return Promise.resolve([]);
    }

    return tx.upload.findMany({ where: { id: { in: ids } } });
  }

  findByReevaluation(reevaluationId: string, tx: PrismaTransaction = this.db) {
    return tx.upload.findMany({ where: { reevaluationId } });
  }

  deleteByIds(ids: string[], tx: PrismaTransaction = this.db) {
    if (!ids.length) {
      return Promise.resolve({ count: 0 });
    }

    return tx.upload.deleteMany({ where: { id: { in: ids } } });
  }
}
