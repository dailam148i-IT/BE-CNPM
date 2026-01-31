import { Notification, CreateNotificationDto, NotificationFilter } from './notification.model.js';
declare class NotificationService {
    private sseClients;
    /**
     * Register SSE client
     */
    registerClient(clientId: string, userId: string | null, response: any): void;
    /**
     * Unregister SSE client
     */
    unregisterClient(clientId: string): void;
    /**
     * Broadcast notification to relevant clients
     */
    broadcast(notification: Notification): void;
    /**
     * Create notification
     */
    create(dto: CreateNotificationDto): Promise<Notification>;
    /**
     * Get notifications for user (or admin if userId is null)
     */
    getByUser(userId: string | null, filter?: NotificationFilter): Promise<Notification[]>;
    /**
     * Get unread count
     */
    getUnreadCount(userId: string | null): Promise<number>;
    /**
     * Mark notification as read
     */
    markAsRead(id: string, userId: string | null): Promise<boolean>;
    /**
     * Mark all as read
     */
    markAllAsRead(userId: string | null): Promise<number>;
    /**
     * Delete old notifications (cleanup job)
     */
    deleteOld(daysOld?: number): Promise<number>;
    /**
     * Notify admin about new order
     */
    notifyNewOrder(orderId: string, customerName: string, total: number): Promise<Notification>;
    /**
     * Notify admin about low stock
     */
    notifyLowStock(productId: string, productName: string, quantity: number): Promise<Notification>;
    /**
     * Notify admin about new review
     */
    notifyNewReview(reviewId: string, productName: string, rating: number): Promise<Notification>;
    /**
     * Notify user about order status
     */
    notifyOrderStatus(userId: string, orderId: string, status: string): Promise<Notification>;
}
export declare const notificationService: NotificationService;
export {};
//# sourceMappingURL=notification.service.d.ts.map