import { Router } from 'express';
import { NotificationController } from './notification.controller.js';
import { authenticate } from '../../utils/keycloak.js';

const router = Router();
const controller = new NotificationController();

// All notification routes require authentication
router.use(authenticate);

// Get user's notifications
router.get('/', controller.getNotifications);

// Get unread count
router.get('/unread-count', controller.getUnreadCount);

// Mark all as read
router.patch('/mark-all-read', controller.markAllAsRead);

// Mark specific notification as read
router.patch('/:id/read', controller.markAsRead);

// Delete notification
router.delete('/:id', controller.deleteNotification);

export default router;
