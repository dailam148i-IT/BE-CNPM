/**
 * =============================================================================
 * ORDER.ROUTES.TS - Định nghĩa Routes cho Order Module
 * =============================================================================
 * 
 * File này định nghĩa các API endpoints cho Order module
 * 
 * ENDPOINTS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path                    │ Description           │ Access      │
 * ├────────┼─────────────────────────┼───────────────────────┼─────────────┤
 * │ POST   │ /api/orders             │ Tạo đơn (checkout)    │ User        │
 * │ GET    │ /api/orders             │ Danh sách đơn hàng    │ User/Admin  │
 * │ GET    │ /api/orders/:id         │ Chi tiết đơn hàng     │ Owner/Admin │
 * │ PUT    │ /api/orders/:id/status  │ Cập nhật trạng thái   │ Admin       │
 * │ PUT    │ /api/orders/:id/payment │ Cập nhật thanh toán   │ Admin       │
 * │ PUT    │ /api/orders/:id/cancel  │ Hủy đơn hàng          │ Owner/Admin │
 * └─────────────────────────────────────────────────────────────────────────┘
 * 
 * MIDDLEWARE CHAIN:
 * 1. authenticate - Xác thực JWT token
 * 2. validate - Validate request body bằng Zod schema
 * 3. authorize - Kiểm tra quyền (cho admin routes)
 * 4. controller - Xử lý business logic
 */

import { Router } from 'express';
import { orderController } from './order.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  updatePaymentStatusSchema,
  queryOrdersSchema,
  cancelOrderSchema,
} from './order.schema.js';

const router = Router();

// ============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================================

// Tất cả routes trong module này đều yêu cầu đăng nhập
router.use(authenticate);

// ============================================================================
// USER ROUTES - Có thể access bởi tất cả authenticated users
// ============================================================================

/**
 * POST /api/orders
 * Tạo đơn hàng mới (checkout)
 * 
 * Access: Authenticated users
 * Body: { shippingAddress, shippingPhone, paymentMethod, note? }
 * 
 * Flow:
 * 1. Lấy items từ cart của user
 * 2. Validate stock availability
 * 3. Tạo Order, OrderDetails, Transaction
 * 4. Trừ stock, xóa cart
 * 5. Return order info
 */
router.post(
  '/',
  validate(createOrderSchema),
  orderController.create
);

/**
 * GET /api/orders
 * Lấy danh sách đơn hàng
 * 
 * Access: Authenticated users
 * - User: Xem orders của mình
 * - Admin: Xem tất cả orders
 * 
 * Query: ?status=PENDING&page=1&limit=10&sortBy=createdAt&sortOrder=desc
 */
router.get(
  '/',
  validateQuery(queryOrdersSchema),
  orderController.findAll
);

/**
 * GET /api/orders/:id
 * Lấy chi tiết một đơn hàng
 * 
 * Access: Order owner hoặc Admin
 */
router.get('/:id', orderController.getById);

/**
 * PUT /api/orders/:id/cancel
 * Hủy đơn hàng
 * 
 * Access: Order owner hoặc Admin
 * Body: { reason? }
 * 
 * Rules:
 * - Chỉ hủy được khi status = PENDING hoặc CONFIRMED
 * - Stock được hoàn lại
 */
router.put(
  '/:id/cancel',
  validate(cancelOrderSchema),
  orderController.cancel
);

// ============================================================================
// ADMIN ONLY ROUTES - Chỉ admin mới access được
// ============================================================================

/**
 * PUT /api/orders/:id/status
 * Cập nhật trạng thái đơn hàng
 * 
 * Access: Admin only
 * Body: { status: "CONFIRMED" | "SHIPPING" | "COMPLETED" | "CANCELLED" }
 * 
 * Valid Transitions:
 * - PENDING → CONFIRMED, CANCELLED
 * - CONFIRMED → SHIPPING, CANCELLED
 * - SHIPPING → COMPLETED
 */
router.put(
  '/:id/status',
  authorize('ADMIN'),
  validate(updateOrderStatusSchema),
  orderController.updateStatus
);

/**
 * PUT /api/orders/:id/payment
 * Cập nhật trạng thái thanh toán
 * 
 * Access: Admin only
 * Body: { paymentStatus: "PAID" | "REFUNDED" }
 * 
 * Use cases:
 * - COD: Đánh dấu PAID khi shipper nộp tiền
 * - Online: Webhook tự động update (hoặc admin manual)
 * - Refund: Đánh dấu REFUNDED khi hoàn tiền
 */
router.put(
  '/:id/payment',
  authorize('ADMIN'),
  validate(updatePaymentStatusSchema),
  orderController.updatePaymentStatus
);

export default router;
