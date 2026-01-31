/**
 * =============================================================================
 * ORDER.SCHEMA.TS - Validation Schemas cho Order Module
 * =============================================================================
 * 
 * File này định nghĩa các Zod schemas để validate dữ liệu đầu vào cho:
 * 1. Tạo đơn hàng (checkout)
 * 2. Cập nhật trạng thái đơn hàng (admin)
 * 3. Query danh sách đơn hàng
 * 4. Xử lý thanh toán
 * 
 * LUỒNG ĐẶT HÀNG:
 * 1. User có items trong cart
 * 2. User checkout với shipping info + payment method
 * 3. Hệ thống:
 *    - Tạo Order với status PENDING, paymentStatus UNPAID
 *    - Tạo OrderDetails từ cart items
 *    - Tạo Transaction record
 *    - Xóa cart items
 * 4. Nếu COD: Order chờ admin confirm khi giao hàng
 * 5. Nếu SePay: Redirect user đến payment gateway
 * 
 * ORDER STATUS FLOW:
 *   PENDING → CONFIRMED → SHIPPING → COMPLETED
 *          ↘ CANCELLED (có thể cancel từ PENDING hoặc CONFIRMED)
 * 
 * PAYMENT STATUS FLOW:
 *   UNPAID → PAID (khi thanh toán thành công)
 *         ↘ REFUNDED (khi hoàn tiền)
 */

import { z } from 'zod';

// ============================================================================
// ENUMS - Đồng bộ với Prisma schema
// ============================================================================

/**
 * OrderStatus Enum
 * 
 * PENDING:   Chờ xác nhận (mới tạo)
 * CONFIRMED: Đã xác nhận (admin duyệt)
 * SHIPPING:  Đang giao hàng
 * COMPLETED: Hoàn thành
 * CANCELLED: Đã hủy
 */
export const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED', 
  'SHIPPING',
  'COMPLETED',
  'CANCELLED',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

/**
 * PaymentStatus Enum
 * 
 * UNPAID:   Chưa thanh toán
 * PAID:     Đã thanh toán
 * REFUNDED: Đã hoàn tiền
 */
export const PaymentStatusEnum = z.enum([
  'UNPAID',
  'PAID',
  'REFUNDED',
]);
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

/**
 * PaymentMethod Enum
 * 
 * COD:   Thanh toán khi nhận hàng (Cash on Delivery)
 * SEPAY: Thanh toán qua SePay gateway (VietQR, NAPAS, thẻ)
 */
export const PaymentMethodEnum = z.enum([
  'COD',
  'SEPAY',
]);
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;

// ============================================================================
// CREATE ORDER SCHEMA - Tạo đơn hàng (Checkout)
// ============================================================================

/**
 * Schema cho POST /api/orders (Checkout)
 * 
 * User checkout từ giỏ hàng với:
 * - Thông tin giao hàng (địa chỉ, SĐT)
 * - Phương thức thanh toán
 * - Ghi chú (optional)
 * 
 * QUAN TRỌNG:
 * - Cart items được lấy từ database, không truyền từ client
 * - Điều này đảm bảo giá và số lượng chính xác
 * - Tránh client manipulation
 * 
 * EXAMPLE REQUEST:
 * {
 *   "shippingAddress": "123 Nguyễn Huệ, Q1, TP.HCM",
 *   "shippingPhone": "0909123456",
 *   "paymentMethod": "COD",
 *   "note": "Giao giờ hành chính"
 * }
 */
export const createOrderSchema = z.object({
  /**
   * Địa chỉ giao hàng đầy đủ
   * - Bao gồm: số nhà, đường, phường/xã, quận/huyện, tỉnh/thành
   * - Tối đa 500 ký tự
   */
  shippingAddress: z
    .string({ message: 'Địa chỉ giao hàng là bắt buộc' })
    .min(10, 'Địa chỉ phải có ít nhất 10 ký tự')
    .max(500, 'Địa chỉ không được quá 500 ký tự'),

  /**
   * Số điện thoại người nhận
   * - Định dạng VN: 10-11 số, bắt đầu bằng 0
   */
  shippingPhone: z
    .string({ message: 'Số điện thoại là bắt buộc' })
    .regex(
      /^0[3|5|7|8|9][0-9]{8}$/,
      'Số điện thoại không hợp lệ (VD: 0909123456)'
    ),

  /**
   * Phương thức thanh toán
   * - COD: Thanh toán khi nhận hàng
   * - SEPAY: Thanh toán online qua SePay
   */
  paymentMethod: PaymentMethodEnum,

  /**
   * Ghi chú đơn hàng (optional)
   * - Ví dụ: "Giao giờ hành chính", "Gọi trước khi giao"
   */
  note: z
    .string()
    .max(500, 'Ghi chú không được quá 500 ký tự')
    .optional(),
});

export type CreateOrderDto = z.infer<typeof createOrderSchema>;

// ============================================================================
// UPDATE ORDER STATUS SCHEMA - Cập nhật trạng thái (Admin)
// ============================================================================

/**
 * Schema cho PUT /api/orders/:id/status (Admin only)
 * 
 * Admin cập nhật trạng thái đơn hàng:
 * - PENDING → CONFIRMED: Xác nhận đơn hàng
 * - CONFIRMED → SHIPPING: Bắt đầu giao hàng
 * - SHIPPING → COMPLETED: Hoàn thành giao hàng
 * - PENDING/CONFIRMED → CANCELLED: Hủy đơn hàng
 * 
 * EXAMPLE REQUEST:
 * {
 *   "status": "CONFIRMED"
 * }
 */
export const updateOrderStatusSchema = z.object({
  /**
   * Trạng thái mới của đơn hàng
   */
  status: OrderStatusEnum,
});

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;

// ============================================================================
// UPDATE PAYMENT STATUS SCHEMA - Cập nhật trạng thái thanh toán (Admin/System)
// ============================================================================

/**
 * Schema cho PUT /api/orders/:id/payment-status (Admin/Webhook)
 * 
 * Cập nhật trạng thái thanh toán:
 * - UNPAID → PAID: Khi nhận được tiền (COD khi giao hoặc SePay webhook)
 * - PAID → REFUNDED: Khi hoàn tiền
 * 
 * EXAMPLE REQUEST:
 * {
 *   "paymentStatus": "PAID"
 * }
 */
export const updatePaymentStatusSchema = z.object({
  /**
   * Trạng thái thanh toán mới
   */
  paymentStatus: PaymentStatusEnum,
});

export type UpdatePaymentStatusDto = z.infer<typeof updatePaymentStatusSchema>;

// ============================================================================
// QUERY ORDERS SCHEMA - Lọc và phân trang danh sách đơn hàng
// ============================================================================

/**
 * Schema cho GET /api/orders (List orders)
 * 
 * Query parameters để lọc và phân trang:
 * - User thường: Chỉ xem đơn của mình
 * - Admin: Xem tất cả đơn, có thể filter theo status, date range
 * 
 * EXAMPLE QUERY:
 * GET /api/orders?status=PENDING&page=1&limit=10
 * 
 * ADMIN QUERY:
 * GET /api/orders?status=SHIPPING&fromDate=2024-01-01&toDate=2024-01-31
 */
export const queryOrdersSchema = z.object({
  /**
   * Lọc theo trạng thái đơn hàng
   */
  status: OrderStatusEnum.optional(),

  /**
   * Lọc theo trạng thái thanh toán
   */
  paymentStatus: PaymentStatusEnum.optional(),

  /**
   * Lọc đơn hàng từ ngày (format: YYYY-MM-DD)
   */
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'fromDate phải có format YYYY-MM-DD')
    .optional(),

  /**
   * Lọc đơn hàng đến ngày (format: YYYY-MM-DD)
   */
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'toDate phải có format YYYY-MM-DD')
    .optional(),

  /**
   * Trang hiện tại (bắt đầu từ 1)
   * Default: 1
   */
  page: z.coerce.number().int().positive().default(1),

  /**
   * Số items mỗi trang
   * Default: 10, Max: 100
   */
  limit: z.coerce.number().int().positive().max(100).default(10),

  /**
   * Sắp xếp theo field
   * Default: createdAt
   */
  sortBy: z.enum(['createdAt', 'totalMoney', 'status']).default('createdAt'),

  /**
   * Thứ tự sắp xếp
   * Default: desc (mới nhất trước)
   */
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type QueryOrdersDto = z.infer<typeof queryOrdersSchema>;

// ============================================================================
// CANCEL ORDER SCHEMA - Hủy đơn hàng
// ============================================================================

/**
 * Schema cho PUT /api/orders/:id/cancel
 * 
 * User hoặc Admin hủy đơn hàng:
 * - Chỉ hủy được khi status = PENDING hoặc CONFIRMED
 * - Không thể hủy khi đang SHIPPING hoặc đã COMPLETED
 * 
 * EXAMPLE REQUEST:
 * {
 *   "reason": "Khách yêu cầu hủy"
 * }
 */
export const cancelOrderSchema = z.object({
  /**
   * Lý do hủy đơn (optional nhưng nên có)
   */
  reason: z
    .string()
    .max(500, 'Lý do không được quá 500 ký tự')
    .optional(),
});

export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;

// ============================================================================
// EXPORTS - Type definitions for service layer
// ============================================================================

/**
 * Order với đầy đủ thông tin quan hệ
 * Dùng cho response API
 */
export interface OrderWithDetails {
  id: string;
  userId: string | null;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalMoney: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: string;
  shippingPhone: string;
  note: string | null;
  createdAt: Date;
  details: {
    id: string;
    productId: string;
    productName: string;
    productImage: string | null;
    price: number;
    quantity: number;
    subtotal: number;
  }[];
  user?: {
    id: string;
    fullName: string | null;
    email: string;
    phone: string | null;
  };
}

/**
 * Paginated response cho list orders
 */
export interface PaginatedOrders {
  orders: OrderWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
