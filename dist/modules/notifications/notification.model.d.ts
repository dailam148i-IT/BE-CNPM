/**
 * Notification Types and Interfaces
 */
export type NotificationType = 'ORDER_NEW' | 'ORDER_STATUS' | 'ORDER_CANCELLED' | 'STOCK_LOW' | 'STOCK_OUT' | 'REVIEW_NEW' | 'USER_REGISTERED' | 'ACCOUNT_LOCKED' | 'ACCOUNT_UNLOCKED' | 'PROMOTION' | 'SYSTEM';
export interface Notification {
    id: string;
    userId: string | null;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    createdAt: Date;
    readAt?: Date;
}
export interface CreateNotificationDto {
    userId?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
}
export interface NotificationFilter {
    userId?: string | null;
    isRead?: boolean;
    type?: NotificationType;
    limit?: number;
    offset?: number;
}
export interface SSEEvent {
    type: 'notification' | 'ping';
    data: Notification | {
        timestamp: number;
    };
}
//# sourceMappingURL=notification.model.d.ts.map