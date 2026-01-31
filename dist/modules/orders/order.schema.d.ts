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
/**
 * OrderStatus Enum
 *
 * PENDING:   Chờ xác nhận (mới tạo)
 * CONFIRMED: Đã xác nhận (admin duyệt)
 * SHIPPING:  Đang giao hàng
 * COMPLETED: Hoàn thành
 * CANCELLED: Đã hủy
 */
export declare const OrderStatusEnum: z.ZodEnum<["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"]>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
/**
 * PaymentStatus Enum
 *
 * UNPAID:   Chưa thanh toán
 * PAID:     Đã thanh toán
 * REFUNDED: Đã hoàn tiền
 */
export declare const PaymentStatusEnum: z.ZodEnum<["UNPAID", "PAID", "REFUNDED"]>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;
/**
 * PaymentMethod Enum
 *
 * COD:   Thanh toán khi nhận hàng (Cash on Delivery)
 * SEPAY: Thanh toán qua SePay gateway (VietQR, NAPAS, thẻ)
 */
export declare const PaymentMethodEnum: z.ZodEnum<["COD", "SEPAY"]>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
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
export declare const createOrderSchema: z.ZodObject<{
    /**
     * Địa chỉ giao hàng đầy đủ
     * - Bao gồm: số nhà, đường, phường/xã, quận/huyện, tỉnh/thành
     * - Tối đa 500 ký tự
     */
    shippingAddress: z.ZodString;
    /**
     * Số điện thoại người nhận
     * - Định dạng VN: 10-11 số, bắt đầu bằng 0
     */
    shippingPhone: z.ZodString;
    /**
     * Phương thức thanh toán
     * - COD: Thanh toán khi nhận hàng
     * - SEPAY: Thanh toán online qua SePay
     */
    paymentMethod: z.ZodEnum<["COD", "SEPAY"]>;
    /**
     * Ghi chú đơn hàng (optional)
     * - Ví dụ: "Giao giờ hành chính", "Gọi trước khi giao"
     */
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    shippingAddress: string;
    shippingPhone: string;
    paymentMethod: "COD" | "SEPAY";
    note?: string | undefined;
}, {
    shippingAddress: string;
    shippingPhone: string;
    paymentMethod: "COD" | "SEPAY";
    note?: string | undefined;
}>;
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
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
export declare const updateOrderStatusSchema: z.ZodObject<{
    /**
     * Trạng thái mới của đơn hàng
     */
    status: z.ZodEnum<["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"]>;
}, "strip", z.ZodTypeAny, {
    status: "CONFIRMED" | "CANCELLED" | "PENDING" | "SHIPPING" | "COMPLETED";
}, {
    status: "CONFIRMED" | "CANCELLED" | "PENDING" | "SHIPPING" | "COMPLETED";
}>;
export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>;
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
export declare const updatePaymentStatusSchema: z.ZodObject<{
    /**
     * Trạng thái thanh toán mới
     */
    paymentStatus: z.ZodEnum<["UNPAID", "PAID", "REFUNDED"]>;
}, "strip", z.ZodTypeAny, {
    paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
}, {
    paymentStatus: "UNPAID" | "PAID" | "REFUNDED";
}>;
export type UpdatePaymentStatusDto = z.infer<typeof updatePaymentStatusSchema>;
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
export declare const queryOrdersSchema: z.ZodObject<{
    /**
     * Lọc theo trạng thái đơn hàng
     */
    status: z.ZodOptional<z.ZodEnum<["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"]>>;
    /**
     * Lọc theo trạng thái thanh toán
     */
    paymentStatus: z.ZodOptional<z.ZodEnum<["UNPAID", "PAID", "REFUNDED"]>>;
    /**
     * Lọc đơn hàng từ ngày (format: YYYY-MM-DD)
     */
    fromDate: z.ZodOptional<z.ZodString>;
    /**
     * Lọc đơn hàng đến ngày (format: YYYY-MM-DD)
     */
    toDate: z.ZodOptional<z.ZodString>;
    /**
     * Trang hiện tại (bắt đầu từ 1)
     * Default: 1
     */
    page: z.ZodDefault<z.ZodNumber>;
    /**
     * Số items mỗi trang
     * Default: 10, Max: 100
     */
    limit: z.ZodDefault<z.ZodNumber>;
    /**
     * Sắp xếp theo field
     * Default: createdAt
     */
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "totalMoney", "status"]>>;
    /**
     * Thứ tự sắp xếp
     * Default: desc (mới nhất trước)
     */
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy: "status" | "createdAt" | "totalMoney";
    status?: "CONFIRMED" | "CANCELLED" | "PENDING" | "SHIPPING" | "COMPLETED" | undefined;
    paymentStatus?: "UNPAID" | "PAID" | "REFUNDED" | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}, {
    status?: "CONFIRMED" | "CANCELLED" | "PENDING" | "SHIPPING" | "COMPLETED" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "status" | "createdAt" | "totalMoney" | undefined;
    paymentStatus?: "UNPAID" | "PAID" | "REFUNDED" | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}>;
export type QueryOrdersDto = z.infer<typeof queryOrdersSchema>;
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
export declare const cancelOrderSchema: z.ZodObject<{
    /**
     * Lý do hủy đơn (optional nhưng nên có)
     */
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;
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
//# sourceMappingURL=order.schema.d.ts.map