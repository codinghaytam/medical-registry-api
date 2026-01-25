import { Prisma, Notification, NotificationEventType } from '@prisma/client';
import prisma from '../../lib/prisma.js';

export class NotificationRepository {
  async create(
    data: {
      userId: string;
      eventType: NotificationEventType;
      message: string;
      metadata?: Prisma.InputJsonValue;
    },
    tx?: Prisma.TransactionClient
  ): Promise<Notification> {
    const client = tx || prisma;
    return client.notification.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        message: data.message,
        metadata: data.metadata || Prisma.JsonNull,
        isRead: false
      }
    });
  }

  async findByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });
  }

  async findById(id: string): Promise<Notification | null> {
    return prisma.notification.findUnique({
      where: { id }
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });
    return result.count;
  }

  async delete(id: string): Promise<void> {
    await prisma.notification.delete({
      where: { id }
    });
  }

  async countUnread(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true
      }
    });
    return result.count;
  }
}
