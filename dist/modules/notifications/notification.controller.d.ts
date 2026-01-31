import { Request, Response, NextFunction } from 'express';
export declare const notificationController: {
    /**
     * GET /api/notifications
     * Get notifications for current user (or admin)
     */
    list(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * GET /api/notifications/unread-count
     * Get unread notification count
     */
    unreadCount(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * POST /api/notifications/:id/read
     * Mark notification as read
     */
    markAsRead(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * POST /api/notifications/read-all
     * Mark all notifications as read
     */
    markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=notification.controller.d.ts.map