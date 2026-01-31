/**
 * =============================================================================
 * ORDER.CONTROLLER.TS - Xử lý Request/Response cho Order Module
 * =============================================================================
 *
 * Controller này đóng vai trò trung gian giữa Routes và Service:
 * - Nhận request từ client
 * - Lấy data từ req.body, req.params, req.query
 * - Gọi service methods tương ứng
 * - Trả response về client
 *
 * ENDPOINTS:
 * - POST   /api/orders              - Tạo đơn hàng (checkout)
 * - GET    /api/orders              - Lấy danh sách đơn hàng
 * - GET    /api/orders/:id          - Lấy chi tiết đơn hàng
 * - PUT    /api/orders/:id/status   - Cập nhật trạng thái (admin)
 * - PUT    /api/orders/:id/payment  - Cập nhật thanh toán (admin)
 * - PUT    /api/orders/:id/cancel   - Hủy đơn hàng
 *
 * AUTHORIZATION:
 * - User: Chỉ xem/hủy được orders của mình
 * - Admin: Xem/update tất cả orders
 */
import { orderService } from './order.service.js';
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Kiểm tra user có phải admin không
 *
 * @param req - Express Request với user info từ authenticate middleware
 * @returns true nếu user là ADMIN
 */
const isAdmin = (req) => {
    return req.user?.role === 'ADMIN';
};
// ============================================================================
// CONTROLLER OBJECT
// ============================================================================
export const orderController = {
    /**
     * =========================================================================
     * CREATE ORDER (Checkout)
     * =========================================================================
     *
     * Route: POST /api/orders
     * Access: Authenticated users
     *
     * Tạo đơn hàng mới từ giỏ hàng của user
     *
     * REQUEST BODY:
     * {
     *   "shippingAddress": "123 Nguyễn Huệ, Q1, TP.HCM",
     *   "shippingPhone": "0909123456",
     *   "paymentMethod": "COD" | "SEPAY",
     *   "note": "Giao giờ hành chính" (optional)
     * }
     *
     * RESPONSE:
     * {
     *   "success": true,
     *   "data": { ...orderDetails },
     *   "message": "Đặt hàng thành công"
     * }
     */
    async create(req, res, next) {
        try {
            const userId = req.user.userId;
            const order = await orderService.create(userId, req.body);
            res.status(201).json({
                success: true,
                data: order,
                message: 'Đặt hàng thành công',
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * =========================================================================
     * GET ORDER BY ID
     * =========================================================================
     *
     * Route: GET /api/orders/:id
     * Access: Order owner hoặc Admin
     *
     * Lấy chi tiết một đơn hàng
     *
     * RESPONSE:
     * {
     *   "success": true,
     *   "data": { ...orderDetails with products }
     * }
     */
    async getById(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const order = await orderService.getById(id, userId, isAdmin(req));
            res.json({ success: true, data: order });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * =========================================================================
     * LIST ORDERS
     * =========================================================================
     *
     * Route: GET /api/orders
     * Access: Authenticated users
     *
     * Lấy danh sách đơn hàng:
     * - User: Chỉ xem orders của mình
     * - Admin: Xem tất cả, có thể filter
     *
     * QUERY PARAMS:
     * - status: PENDING | CONFIRMED | SHIPPING | COMPLETED | CANCELLED
     * - paymentStatus: UNPAID | PAID | REFUNDED
     * - fromDate: YYYY-MM-DD
     * - toDate: YYYY-MM-DD
     * - page: number (default: 1)
     * - limit: number (default: 10)
     * - sortBy: createdAt | totalMoney | status
     * - sortOrder: asc | desc
     *
     * RESPONSE:
     * {
     *   "success": true,
     *   "data": {
     *     "orders": [...],
     *     "total": 50,
     *     "page": 1,
     *     "limit": 10,
     *     "totalPages": 5
     *   }
     * }
     */
    async findAll(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await orderService.findAll(req.query, userId, isAdmin(req));
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * =========================================================================
     * UPDATE ORDER STATUS (Admin only)
     * =========================================================================
     *
     * Route: PUT /api/orders/:id/status
     * Access: Admin only
     *
     * Cập nhật trạng thái đơn hàng
     *
     * REQUEST BODY:
     * {
     *   "status": "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED"
     * }
     *
     * STATUS FLOW:
     *   PENDING → CONFIRMED → SHIPPING → COMPLETED
     *          ↘ CANCELLED
     */
    async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const order = await orderService.updateStatus(id, req.body);
            res.json({
                success: true,
                data: order,
                message: `Đã cập nhật trạng thái thành ${req.body.status}`,
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * =========================================================================
     * UPDATE PAYMENT STATUS (Admin only)
     * =========================================================================
     *
     * Route: PUT /api/orders/:id/payment
     * Access: Admin only
     *
     * Cập nhật trạng thái thanh toán
     *
     * REQUEST BODY:
     * {
     *   "paymentStatus": "PAID" | "REFUNDED"
     * }
     *
     * USE CASES:
     * - COD: Admin mark PAID khi nhận tiền từ shipper
     * - SePay: Webhook callback tự động update
     * - Refund: Admin mark REFUNDED khi hoàn tiền
     */
    async updatePaymentStatus(req, res, next) {
        try {
            const { id } = req.params;
            const order = await orderService.updatePaymentStatus(id, req.body);
            res.json({
                success: true,
                data: order,
                message: `Đã cập nhật thanh toán thành ${req.body.paymentStatus}`,
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * =========================================================================
     * CANCEL ORDER
     * =========================================================================
     *
     * Route: PUT /api/orders/:id/cancel
     * Access: Order owner hoặc Admin
     *
     * Hủy đơn hàng
     *
     * REQUEST BODY:
     * {
     *   "reason": "Khách yêu cầu hủy" (optional)
     * }
     *
     * RULES:
     * - Chỉ hủy được khi status = PENDING hoặc CONFIRMED
     * - Stock được hoàn lại
     * - User chỉ hủy được order của mình
     */
    async cancel(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const order = await orderService.cancel(id, userId, isAdmin(req), req.body);
            res.json({
                success: true,
                data: order,
                message: 'Đã hủy đơn hàng',
            });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=order.controller.js.map