import prisma from '../../config/database.js';
class NotificationService {
    sseClients = new Map();
    /**
     * Register SSE client
     */
    registerClient(clientId, userId, response) {
        this.sseClients.set(clientId, { id: clientId, userId, response });
        console.log(`SSE Client registered: ${clientId}, userId: ${userId || 'admin'}`);
    }
    /**
     * Unregister SSE client
     */
    unregisterClient(clientId) {
        this.sseClients.delete(clientId);
        console.log(`SSE Client unregistered: ${clientId}`);
    }
    /**
     * Broadcast notification to relevant clients
     */
    broadcast(notification) {
        this.sseClients.forEach((client) => {
            // Admin notifications (userId = null) go to admin clients only
            // User notifications go to specific user
            if ((notification.userId === null && client.userId === null) ||
                (notification.userId !== null && notification.userId === client.userId)) {
                try {
                    client.response.write(`data: ${JSON.stringify({
                        type: 'notification',
                        data: notification,
                    })}\n\n`);
                }
                catch (error) {
                    console.error(`Failed to send SSE to client ${client.id}:`, error);
                    this.unregisterClient(client.id);
                }
            }
        });
    }
    /**
     * Create notification
     */
    async create(dto) {
        const result = await prisma.notification.create({
            data: {
                userId: dto.userId ?? null,
                type: dto.type,
                title: dto.title,
                message: dto.message,
                data: dto.data ?? undefined,
                isRead: false,
            },
        });
        const notification = {
            id: result.id,
            userId: result.userId,
            type: result.type,
            title: result.title,
            message: result.message ?? '',
            data: result.data,
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
    async getByUser(userId, filter) {
        const limit = filter?.limit || 50;
        const offset = filter?.offset || 0;
        const results = await prisma.notification.findMany({
            where: {
                userId: userId,
                ...(filter?.isRead !== undefined ? { isRead: filter.isRead } : {}),
                ...(filter?.type ? { type: filter.type } : {}),
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
        return results.map((row) => ({
            id: row.id,
            userId: row.userId,
            type: row.type,
            title: row.title,
            message: row.message ?? '',
            data: row.data,
            isRead: row.isRead,
            createdAt: row.createdAt,
            readAt: row.readAt ?? undefined,
        }));
    }
    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
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
    async markAsRead(id, userId) {
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
        }
        catch {
            return false;
        }
    }
    /**
     * Mark all as read
     */
    async markAllAsRead(userId) {
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
    async deleteOld(daysOld = 30) {
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
    async notifyNewOrder(orderId, customerName, total) {
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
    async notifyLowStock(productId, productName, quantity) {
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
    async notifyNewReview(reviewId, productName, rating) {
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
    async notifyOrderStatus(userId, orderId, status) {
        const statusMessages = {
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
//# sourceMappingURL=notification.service.js.map