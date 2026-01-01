import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PrismaTransaction = PrismaClient | Prisma.TransactionClient;

export { Prisma };
export default prisma;
