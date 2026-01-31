/**
 * =============================================================================
 * ORDER.SERVICE.TS - Business Logic cho Order Module
 * =============================================================================
 *
 * Service này xử lý toàn bộ logic nghiệp vụ liên quan đến đơn hàng:
 *
 * CHECKOUT FLOW:
 * 1. Validate cart có items không
 * 2. Validate stock availability cho tất cả items
 * 3. Tính toán: subtotal, shipping fee, discount, total
 * 4. Tạo Order record với status PENDING
 * 5. Tạo OrderDetail records từ cart items
 * 6. Tạo Transaction record
 * 7. Trừ stock của products
 * 8. Xóa cart items
 * 9. Return order info + payment URL (nếu SePay)
 *
 * ORDER STATUS FLOW:
 *   PENDING → CONFIRMED → SHIPPING → COMPLETED
 *          ↘ CANCELLED
 *
 * PAYMENT FLOW:
 * - COD: paymentStatus = UNPAID cho đến khi admin confirm nhận tiền
 * - SePay: Webhook callback update paymentStatus = PAID
 *
 * IMPORTANT:
 * - Sử dụng transaction để đảm bảo data consistency
 * - Stock được trừ khi tạo order, cộng lại khi cancel
 * - Admin có thể xem/update tất cả orders
 * - User chỉ xem được orders của mình
 */
import type { CreateOrderDto, UpdateOrderStatusDto, UpdatePaymentStatusDto, QueryOrdersDto, CancelOrderDto, OrderWithDetails, PaginatedOrders } from './order.schema.js';
export declare const orderService: {
    /**
     * =========================================================================
     * CREATE ORDER (Checkout)
     * =========================================================================
     *
     * Tạo đơn hàng mới từ giỏ hàng của user
     *
     * FLOW:
     * 1. Lấy cart với items của user
     * 2. Validate cart không rỗng
     * 3. Validate stock cho từng item
     * 4. Tính subtotal, shipping, total
     * 5. Tạo Order + OrderDetails + Transaction trong transaction
     * 6. Trừ stock products
     * 7. Xóa cart items
     * 8. Return order với payment info
     *
     * @param userId - ID của user đặt hàng
     * @param data - Thông tin checkout (address, phone, paymentMethod)
     * @returns Order đã tạo với đầy đủ details
     * @throws BadRequestError nếu cart rỗng hoặc hết stock
     */
    create(userId: string, data: CreateOrderDto): Promise<OrderWithDetails>;
    /**
     * =========================================================================
     * GET ORDER BY ID
     * =========================================================================
     *
     * Lấy chi tiết một đơn hàng
     *
     * @param orderId - ID của order
     * @param userId - ID của user (để check quyền xem)
     * @param isAdmin - User có phải admin không (admin xem được mọi order)
     * @returns Order với đầy đủ details
     * @throws NotFoundError nếu không tìm thấy
     * @throws ForbiddenError nếu user không có quyền xem
     */
    getById(orderId: string, userId: string, isAdmin?: boolean): Promise<OrderWithDetails>;
    /**
     * =========================================================================
     * LIST ORDERS (with pagination and filters)
     * =========================================================================
     *
     * Lấy danh sách đơn hàng với filter và pagination
     *
     * - User: Chỉ xem orders của mình
     * - Admin: Xem tất cả orders, có thể filter
     *
     * @param query - Query params (status, date range, pagination)
     * @param userId - ID của user
     * @param isAdmin - User có phải admin không
     * @returns Paginated list of orders
     */
    findAll(query: QueryOrdersDto, userId: string, isAdmin?: boolean): Promise<PaginatedOrders>;
    /**
     * =========================================================================
     * UPDATE ORDER STATUS (Admin only)
     * =========================================================================
     *
     * Cập nhật trạng thái đơn hàng
     *
     * VALID TRANSITIONS:
     * - PENDING → CONFIRMED, CANCELLED
     * - CONFIRMED → SHIPPING, CANCELLED
     * - SHIPPING → COMPLETED
     * - COMPLETED → (không chuyển được)
     * - CANCELLED → (không chuyển được)
     *
     * @param orderId - ID của order
     * @param data - { status: newStatus }
     * @returns Updated order
     * @throws NotFoundError nếu không tìm thấy
     * @throws BadRequestError nếu transition không hợp lệ
     */
    updateStatus(orderId: string, data: UpdateOrderStatusDto): Promise<OrderWithDetails>;
    /**
     * =========================================================================
     * UPDATE PAYMENT STATUS (Admin/Webhook)
     * =========================================================================
     *
     * Cập nhật trạng thái thanh toán
     *
     * @param orderId - ID của order
     * @param data - { paymentStatus: newStatus }
     * @returns Updated order
     */
    updatePaymentStatus(orderId: string, data: UpdatePaymentStatusDto): Promise<OrderWithDetails>;
    /**
     * =========================================================================
     * CANCEL ORDER
     * =========================================================================
     *
     * Hủy đơn hàng và hoàn lại stock
     *
     * RULES:
     * - Chỉ hủy được khi status = PENDING hoặc CONFIRMED
     * - User có thể tự hủy order của mình
     * - Admin có thể hủy bất kỳ order nào
     * - Stock được hoàn lại khi hủy
     *
     * @param orderId - ID của order
     * @param userId - ID của user (để check quyền)
     * @param isAdmin - User có phải admin không
     * @param data - { reason: optional cancel reason }
     * @returns Cancelled order
     * @throws BadRequestError nếu không thể hủy
     */
    cancel(orderId: string, userId: string, isAdmin?: boolean, data?: CancelOrderDto): Promise<OrderWithDetails>;
};
//# sourceMappingURL=order.service.d.ts.map