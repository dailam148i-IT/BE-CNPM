import { randomUUID } from 'crypto';
import prisma from '../../config/database.js';
import {
    Notification,
    CreateNotificationDto,
    NotificationFilter,
    NotificationType,
} from './notification.model.js';
import { NotificationType as PrismaNotificationType } from '@prisma/client';

// Store SSE clients for broadcasting
interface SSEClient {
    id: string;
    userId: string | null; // null = admin
    response: any;
}

class NotificationService {
    private sseClients: Map<string, SSEClient> = new Map();

    /**
     * Register SSE client
     */
    registerClient(clientId: string, userId: string | null, response: any): void {
        this.sseClients.set(clientId, { id: clientId, userId, response });
        console.log(`SSE Client registered: ${clientId}, userId: ${userId || 'admin'}`);
    }

    /**
     * Unregister SSE client
     */
    unregisterClient(clientId: string): void {
        this.sseClients.delete(clientId);
        console.log(`SSE Client unregistered: ${clientId}`);
    }

    /**
     * Broadcast notification to relevant clients
     */
    broadcast(notification: Notification): void {
        this.sseClients.forEach((client) => {
            // Admin notifications (userId = null) go to admin clients only
            // User notifications go to specific user
            if (
                (notification.userId === null && client.userId === null) ||
                (notification.userId !== null && notification.userId === client.userId)
            ) {
                try {
                    client.response.write(`data: ${JSON.stringify({
                        type: 'notification',
                        data: notification,
                    })}\n\n`);
                } catch (error) {
                    console.error(`Failed to send SSE to client ${client.id}:`, error);
                    this.unregisterClient(client.id);
                }
            }
        });
    }

    /**
     * Create notification
     */
    async create(dto: CreateNotificationDto): Promise<Notification> {
        const result = await prisma.notification.create({
            data: {
                userId: dto.userId ?? null,
                type: dto.type as PrismaNotificationType,
                title: dto.title,
                message: dto.message,
                data: dto.data ?? undefined,
                isRead: false,
            },
        });

        const notification: Notification = {
            id: result.id,
            userId: result.userId,
            type: result.type as NotificationType,
            title: result.title,
            message: result.message ?? '',
            data: result.data as Record<string, any> | undefined,
            isRead: result.isRead,
            createdAt: result.createdAt,
            readAt: result.readAt ?? undefined,
        };

        // Broadcast to SSE clients
        this.broadcast(notification);

        return notification;
    }

    /**
     * Get notifications for user (or admin if userId is null)
     */
    async getByUser(userId: string | null, filter?: NotificationFilter): Promise<Notification[]> {
        const limit = filter?.limit || 50;
        const offset = filter?.offset || 0;

        const results = await prisma.notification.findMany({
            where: {
                userId: userId,
                ...(filter?.isRead !== undefined ? { isRead: filter.isRead } : {}),
                ...(filter?.type ? { type: filter.type as PrismaNotificationType } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });

        return results.map((row) => ({
            id: row.id,
            userId: row.userId,
            type: row.type as NotificationType,
            title: row.title,
            message: row.message ?? '',
            data: row.data as Record<string, any> | undefined,
            isRead: row.isRead,
            createdAt: row.createdAt,
            readAt: row.readAt ?? undefined,
        }));
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId: string | null): Promise<number> {
        return prisma.notification.count({
            where: {
                userId: userId,
                isRead: false,
            },
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(id: string, userId: string | null): Promise<boolean> {
        try {
            await prisma.notification.updateMany({
                where: {
                    id: id,
                    userId: userId,
                },
                data: {
                    isRead: true,
                    readAt: new Date(),
                },
            });
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Mark all as read
     */
    async markAllAsRead(userId: string | null): Promise<number> {
        const result = await prisma.notification.updateMany({
            where: {
                userId: userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
        return result.count;
    }

    /**
     * Delete old notifications (cleanup job)
     */
    async deleteOld(daysOld: number = 30): Promise<number> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);
        
        const result = await prisma.notification.deleteMany({
            where: {
                createdAt: { lt: cutoffDate },
            },
        });
        return result.count;
    }

    // ============ HELPER METHODS FOR EVENT TRIGGERS ============

    /**
     * Notify admin about new order
     */
    async notifyNewOrder(orderId: string, customerName: string, total: number): Promise<Notification> {
        return this.create({
            userId: null, // Admin notification
            type: 'ORDER_NEW',
            title: 'Đơn hàng mới',
            message: `${customerName} vừa đặt đơn hàng ${total.toLocaleString('vi-VN')}đ`,
            data: { orderId },
        });
    }

    /**
     * Notify admin about low stock
     */
    async notifyLowStock(productId: string, productName: string, quantity: number): Promise<Notification> {
        return this.create({
            userId: null,
            type: 'STOCK_LOW',
            title: 'Sắp hết hàng',
            message: `${productName} chỉ còn ${quantity} sản phẩm`,
            data: { productId, quantity },
        });
    }

    /**
     * Notify admin about new review
     */
    async notifyNewReview(reviewId: string, productName: string, rating: number): Promise<Notification> {
        return this.create({
            userId: null,
            type: 'REVIEW_NEW',
            title: 'Đánh giá mới',
            message: `Có đánh giá mới cho "${productName}" - ${rating} sao`,
            data: { reviewId, rating },
        });
    }

    /**
     * Notify user about order status
     */
    async notifyOrderStatus(userId: string, orderId: string, status: string): Promise<Notification> {
        const statusMessages: Record<string, string> = {
            'CONFIRMED': 'Đơn hàng đã được xác nhận',
            'SHIPPED': 'Đơn hàng đang được giao',
            'DELIVERED': 'Đơn hàng đã giao thành công',
            'CANCELLED': 'Đơn hàng đã bị hủy',
        };

        return this.create({
            userId,
            type: 'ORDER_STATUS',
            title: statusMessages[status] || 'Cập nhật đơn hàng',
            message: `Đơn hàng #${orderId.slice(0, 8)} ${statusMessages[status]?.toLowerCase() || status}`,
            data: { orderId, status },
        });
    }
}

export const notificationService = new NotificationService();
