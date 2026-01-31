import { Router } from 'express';
import { notificationController } from './notification.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
const router = Router();
/**
 * NOTIFICATION ROUTES
 *
 * All routes require authentication
 *
 * GET    /api/notifications           - List notifications
 * GET    /api/notifications/unread-count - Get unread count
 * POST   /api/notifications/:id/read  - Mark as read
 * POST   /api/notifications/read-all  - Mark all as read
 */
// All routes require authentication
router.use(authenticate);
router.get('/', notificationController.list);
router.get('/unread-count', notificationController.unreadCount);
router.post('/:id/read', notificationController.markAsRead);
router.post('/read-all', notificationController.markAllAsRead);
export default router;
//# sourceMappingURL=notification.routes.js.map