import { NotificationEventType, Prisma } from '@prisma/client';
import { NotificationRepository } from './notification.repository.js';
import { getSocketIO } from '../../lib/socket.js';
import { logger } from '../../utils/logger.js';

interface NotificationPayload {
    userId: string;
    eventType: NotificationEventType;
    message: string;
    metadata?: Record<string, any>;
}

export class NotificationService {
    constructor(private readonly repository = new NotificationRepository()) { }

    async createNotification(payload: NotificationPayload) {
        const notification = await this.repository.create({
            userId: payload.userId,
            eventType: payload.eventType,
            message: payload.message,
            metadata: payload.metadata as Prisma.InputJsonValue
        });

        // Emit real-time notification via Socket.IO
        this.emitNotification(notification);

        logger.info('Notification created', {
            notificationId: notification.id,
            userId: payload.userId,
            eventType: payload.eventType
        });

        return notification;
    }

    async getUserNotifications(userId: string, limit: number = 50, offset: number = 0) {
        return this.repository.findByUserId(userId, limit, offset);
    }

    async markAsRead(notificationId: string) {
        return this.repository.markAsRead(notificationId);
    }

    async markAllAsRead(userId: string) {
        const count = await this.repository.markAllAsRead(userId);

        // Emit event to update UI
        const io = getSocketIO();
        if (io) {
            io.to(`user:${userId}`).emit('notifications:all-read');
        }

        return { count };
    }

    async deleteNotification(notificationId: string) {
        await this.repository.delete(notificationId);
    }

    async getUnreadCount(userId: string) {
        return this.repository.countUnread(userId);
    }

    // Helper methods for creating specific notification types
    async notifyPatientAssigned(medecinId: string, patientId: string, patientName: string) {
        return this.createNotification({
            userId: medecinId,
            eventType: NotificationEventType.PATIENT_ASSIGNED,
            message: `New patient assigned: ${patientName}`,
            metadata: { patientId, patientName }
        });
    }

    async notifyPatientTransferred(
        targetMedecinId: string,
        patientId: string,
        patientName: string,
        fromField: string,
        toField: string,
        transferredBy: string
    ) {
        return this.createNotification({
            userId: targetMedecinId,
            eventType: NotificationEventType.PATIENT_TRANSFERRED,
            message: `Patient ${patientName} transferred from ${fromField} to ${toField} by ${transferredBy}`,
            metadata: {
                patientId,
                patientName,
                fromField,
                toField,
                transferredBy
            }
        });
    }

    async notifyPatientReevaluated(
        originalMedecinId: string,
        patientId: string,
        patientName: string,
        reevaluatedBy: string
    ) {
        return this.createNotification({
            userId: originalMedecinId,
            eventType: NotificationEventType.PATIENT_REEVALUATED,
            message: `Patient ${patientName} was re-evaluated by ${reevaluatedBy}`,
            metadata: {
                patientId,
                patientName,
                reevaluatedBy
            }
        });
    }

    private emitNotification(notification: any) {
        const io = getSocketIO();
        if (io) {
            // Emit to the specific user's room
            io.to(`user:${notification.userId}`).emit('notification:new', notification);
            logger.debug('Notification emitted via WebSocket', {
                userId: notification.userId,
                notificationId: notification.id
            });
        } else {
            logger.warn('Socket.IO not initialized, notification not emitted in real-time');
        }
    }
}
