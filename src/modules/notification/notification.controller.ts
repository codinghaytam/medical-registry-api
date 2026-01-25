import { Request, Response } from 'express';
import { NotificationService } from './notification.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiError } from '../../utils/apiError.js';

export class NotificationController {
    constructor(private readonly service = new NotificationService()) { }

    getNotifications = asyncHandler(async (req: Request, res: Response) => {
        // @ts-ignore - userId is added by auth middleware
        const userId = req.user?.id;
        if (!userId) {
            throw ApiError.unauthorized('User not authenticated');
        }

        const limit = parseInt(req.query.limit as string) || 50;
        const offset = parseInt(req.query.offset as string) || 0;

        const notifications = await this.service.getUserNotifications(userId, limit, offset);
        res.json(notifications);
    });

    getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
        // @ts-ignore - userId is added by auth middleware
        const userId = req.user?.id;
        if (!userId) {
            throw ApiError.unauthorized('User not authenticated');
        }

        const count = await this.service.getUnreadCount(userId);
        res.json({ count });
    });

    markAsRead = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const notification = await this.service.markAsRead(id);
        res.json(notification);
    });

    markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
        // @ts-ignore - userId is added by auth middleware
        const userId = req.user?.id;
        if (!userId) {
            throw ApiError.unauthorized('User not authenticated');
        }

        const result = await this.service.markAllAsRead(userId);
        res.json(result);
    });

    deleteNotification = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await this.service.deleteNotification(id);
        res.status(204).send();
    });
}
