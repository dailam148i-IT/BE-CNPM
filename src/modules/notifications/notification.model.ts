/**
 * Notification Types and Interfaces
 */

export type NotificationType =
    | 'ORDER_NEW'           // Đơn hàng mới (Admin)
    | 'ORDER_STATUS'        // Cập nhật trạng thái đơn (User)
    | 'ORDER_CANCELLED'     // Đơn bị hủy
    | 'STOCK_LOW'           // Sắp hết hàng (Admin)
    | 'STOCK_OUT'           // Hết hàng (Admin)
    | 'REVIEW_NEW'          // Đánh giá mới (Admin)
    | 'USER_REGISTERED'     // Người dùng mới đăng ký (Admin)
    | 'ACCOUNT_LOCKED'      // Tài khoản bị khóa (User)
    | 'ACCOUNT_UNLOCKED'    // Tài khoản mở khóa (User)
    | 'PROMOTION'           // Khuyến mãi mới (User)
    | 'SYSTEM';             // Thông báo hệ thống

export interface Notification {
    id: string;
    userId: string | null;  // null = admin notification
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;  // JSON metadata
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

// SSE Event types
export interface SSEEvent {
    type: 'notification' | 'ping';
    data: Notification | { timestamp: number };
}
