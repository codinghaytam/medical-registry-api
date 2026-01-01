import { Prisma, Role } from '@prisma/client';
import prisma, { PrismaTransaction } from '../../lib/prisma.js';

export class UserRepository {
  constructor(private readonly db = prisma) {}

  findAll(tx: PrismaTransaction = this.db) {
    return tx.user.findMany();
  }

  findByRole(role: Role, tx: PrismaTransaction = this.db) {
    return tx.user.findMany({ where: { role } });
  }

  findById(id: string, tx: PrismaTransaction = this.db) {
    return tx.user.findUnique({ where: { id } });
  }

  findByEmail(email: string, tx: PrismaTransaction = this.db) {
    return tx.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput, tx: PrismaTransaction = this.db) {
    return tx.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput, tx: PrismaTransaction = this.db) {
    return tx.user.update({ where: { id }, data });
  }

  delete(id: string, tx: PrismaTransaction = this.db) {
    return tx.user.delete({ where: { id } });
  }
}
