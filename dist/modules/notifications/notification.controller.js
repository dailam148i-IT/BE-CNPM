import { notificationService } from './notification.service.js';
export const notificationController = {
    /**
     * GET /api/notifications
     * Get notifications for current user (or admin)
     */
    async list(req, res, next) {
        try {
            const user = req.user;
            const isAdmin = user?.role === 'ADMIN';
            const userId = isAdmin ? null : user?.id;
            const limit = parseInt(req.query.limit) || 50;
            const offset = parseInt(req.query.offset) || 0;
            const isRead = req.query.isRead !== undefined
                ? req.query.isRead === 'true'
                : undefined;
            const notifications = await notificationService.getByUser(userId, {
                limit,
                offset,
                isRead,
            });
            const unreadCount = await notificationService.getUnreadCount(userId);
            res.json({
                success: true,
                data: {
                    notifications,
                    unreadCount,
                    total: notifications.length,
                },
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * GET /api/notifications/unread-count
     * Get unread notification count
     */
    async unreadCount(req, res, next) {
        try {
            const user = req.user;
            const isAdmin = user?.role === 'ADMIN';
            const userId = isAdmin ? null : user?.id;
            const count = await notificationService.getUnreadCount(userId);
            res.json({
                success: true,
                data: { count },
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * POST /api/notifications/:id/read
     * Mark notification as read
     */
    async markAsRead(req, res, next) {
        try {
            const { id } = req.params;
            const user = req.user;
            const isAdmin = user?.role === 'ADMIN';
            const userId = isAdmin ? null : user?.id;
            const success = await notificationService.markAsRead(id, userId);
            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy thông báo',
                });
            }
            res.json({
                success: true,
                message: 'Đã đánh dấu đã đọc',
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * POST /api/notifications/read-all
     * Mark all notifications as read
     */
    async markAllAsRead(req, res, next) {
        try {
            const user = req.user;
            const isAdmin = user?.role === 'ADMIN';
            const userId = isAdmin ? null : user?.id;
            const count = await notificationService.markAllAsRead(userId);
            res.json({
                success: true,
                message: `Đã đánh dấu ${count} thông báo là đã đọc`,
                data: { count },
            });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=notification.controller.js.map