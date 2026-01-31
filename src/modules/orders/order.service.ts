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

import prisma from '../../config/database.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../middleware/errorHandler.js';
import { notificationService } from '../notifications/notification.service.js';
import type {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  QueryOrdersDto,
  CancelOrderDto,
  OrderWithDetails,
  PaginatedOrders,
} from './order.schema.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Phí ship cố định (có thể mở rộng thành logic tính theo khu vực)
 */
const DEFAULT_SHIPPING_FEE = 30000; // 30,000 VND

/**
 * Status transitions hợp lệ
 * Key: status hiện tại, Value: các status có thể chuyển đến
 */
const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPING', 'CANCELLED'],
  SHIPPING: ['COMPLETED'],
  COMPLETED: [], // Không thể chuyển từ COMPLETED
  CANCELLED: [], // Không thể chuyển từ CANCELLED
};

// ============================================================================
// SERVICE OBJECT
// ============================================================================

export const orderService = {
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
  async create(userId: string, data: CreateOrderDto): Promise<OrderWithDetails> {
    const { shippingAddress, shippingPhone, paymentMethod, note } = data;

    // -----------------------------------------------------------------------
    // 1. Lấy cart với items và product info
    // -----------------------------------------------------------------------
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stockQuantity: true,
                status: true,
                images: {
                  where: { isThumbnail: true },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
      },
    });

    // -----------------------------------------------------------------------
    // 2. Validate cart
    // -----------------------------------------------------------------------
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError('Giỏ hàng trống. Vui lòng thêm sản phẩm trước khi đặt hàng.');
    }

    // -----------------------------------------------------------------------
    // 3. Validate stock và tính toán subtotal
    // -----------------------------------------------------------------------
    let subtotal = 0;
    const orderItems: Array<{
      productId: string;
      productName: string;
      productImage: string | null;
      price: number;
      quantity: number;
    }> = [];

    for (const item of cart.items) {
      const product = item.product;

      // Check product còn active không
      if (product.status !== 'PUBLISHED') {
        throw new BadRequestError(`Sản phẩm "${product.name}" không còn bán`);
      }

      // Check stock
      if (item.quantity > product.stockQuantity) {
        throw new BadRequestError(
          `Sản phẩm "${product.name}" chỉ còn ${product.stockQuantity} trong kho`
        );
      }

      // Lấy giá
      const price = Number(product.price);

      subtotal += price * item.quantity;

      orderItems.push({
        productId: product.id,
        productName: product.name,
        productImage: product.images[0]?.imageUrl ?? null,
        price,
        quantity: item.quantity,
      });
    }

    // -----------------------------------------------------------------------
    // 4. Tính toán các fees
    // -----------------------------------------------------------------------
    const shippingFee = DEFAULT_SHIPPING_FEE;
    const discountAmount = 0; // TODO: Implement coupon/voucher logic
    const totalMoney = subtotal + shippingFee - discountAmount;

    // -----------------------------------------------------------------------
    // 5. Tạo Order trong transaction
    // -----------------------------------------------------------------------
    const order = await prisma.$transaction(async (tx) => {
      // 5.1 Tạo Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          subtotal,
          shippingFee,
          discountAmount,
          totalMoney,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          shippingAddress,
          shippingPhone,
          note,
        },
      });

      // 5.2 Tạo OrderDetails
      await tx.orderDetail.createMany({
        data: orderItems.map((item) => ({
          orderId: newOrder.id,
          productId: item.productId,
          price: item.price,
          quantity: item.quantity,
        })),
      });

      // 5.3 Tạo Transaction record
      await tx.transaction.create({
        data: {
          orderId: newOrder.id,
          paymentMethod,
          amount: totalMoney,
          status: 'PENDING',
          description: `Thanh toán đơn hàng #${newOrder.id}`,
        },
      });

      // 5.4 Trừ stock products
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 5.5 Xóa cart items
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // -----------------------------------------------------------------------
    // 6. Send Notifications
    // -----------------------------------------------------------------------
    
    // 6.1 Notify customer about successful order
    await notificationService.create({
      userId: userId,
      type: 'ORDER_STATUS',
      title: 'Đặt hàng thành công!',
      message: `Đơn hàng #${order.id.slice(0, 8)} đã được tạo. Tổng giá trị: ${Number(order.totalMoney).toLocaleString('vi-VN')}đ`,
      data: { orderId: order.id, status: 'PENDING' },
    });

    // 6.2 Notify admin about new order (for COD or any order)
    await notificationService.notifyNewOrder(
      order.id,
      shippingAddress, // Using shipping address as customer identifier
      Number(order.totalMoney)
    );

    // -----------------------------------------------------------------------
    // 7. Return formatted order
    // -----------------------------------------------------------------------
    return {
      id: order.id,
      userId: order.userId,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discountAmount: Number(order.discountAmount),
      totalMoney: Number(order.totalMoney),
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      shippingPhone: order.shippingPhone,
      note: order.note,
      createdAt: order.createdAt,
      details: orderItems.map((item) => ({
        id: '', // Will be populated if needed
        productId: item.productId,
        productName: item.productName,
        productImage: item.productImage,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
    };
  },

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
  async getById(
    orderId: string,
    userId: string,
    isAdmin: boolean = false
  ): Promise<OrderWithDetails> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: {
          include: {
            product: {
              select: {
                name: true,
                images: {
                  where: { isThumbnail: true },
                  take: 1,
                  select: { imageUrl: true },
                },
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    // Check quyền xem: Admin xem được tất cả, user chỉ xem được order của mình
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenError('Bạn không có quyền xem đơn hàng này');
    }

    // Format response
    return {
      id: order.id,
      userId: order.userId,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discountAmount: Number(order.discountAmount),
      totalMoney: Number(order.totalMoney),
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      shippingPhone: order.shippingPhone,
      note: order.note,
      createdAt: order.createdAt,
      details: order.details.map((detail) => ({
        id: detail.id,
        productId: detail.productId,
        productName: detail.product.name,
        productImage: detail.product.images[0]?.imageUrl ?? null,
        price: Number(detail.price),
        quantity: detail.quantity,
        subtotal: Number(detail.price) * detail.quantity,
      })),
      user: order.user ?? undefined,
    };
  },

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
  async findAll(
    query: QueryOrdersDto,
    userId: string,
    isAdmin: boolean = false
  ): Promise<PaginatedOrders> {
    const {
      status,
      paymentStatus,
      fromDate,
      toDate,
      page,
      limit,
      sortBy,
      sortOrder,
    } = query;

    // Build where clause
    const where: any = {};

    // User chỉ xem được orders của mình
    if (!isAdmin) {
      where.userId = userId;
    }

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Filter by date range
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) {
        where.createdAt.gte = new Date(fromDate);
      }
      if (toDate) {
        // Add 1 day to include the end date
        const endDate = new Date(toDate);
        endDate.setDate(endDate.getDate() + 1);
        where.createdAt.lt = endDate;
      }
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Execute queries
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          details: {
            include: {
              product: {
                select: {
                  name: true,
                  images: {
                    where: { isThumbnail: true },
                    take: 1,
                    select: { imageUrl: true },
                  },
                },
              },
            },
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Format response
    const formattedOrders: OrderWithDetails[] = orders.map((order) => ({
      id: order.id,
      userId: order.userId,
      subtotal: Number(order.subtotal),
      shippingFee: Number(order.shippingFee),
      discountAmount: Number(order.discountAmount),
      totalMoney: Number(order.totalMoney),
      status: order.status,
      paymentStatus: order.paymentStatus,
      shippingAddress: order.shippingAddress,
      shippingPhone: order.shippingPhone,
      note: order.note,
      createdAt: order.createdAt,
      details: order.details.map((detail) => ({
        id: detail.id,
        productId: detail.productId,
        productName: detail.product.name,
        productImage: detail.product.images[0]?.imageUrl ?? null,
        price: Number(detail.price),
        quantity: detail.quantity,
        subtotal: Number(detail.price) * detail.quantity,
      })),
      user: order.user ?? undefined,
    }));

    return {
      orders: formattedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

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
  async updateStatus(
    orderId: string,
    data: UpdateOrderStatusDto
  ): Promise<OrderWithDetails> {
    const { status: newStatus } = data;

    // 1. Tìm order hiện tại
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    // 2. Validate status transition
    const currentStatus = order.status;
    const validNextStatuses = VALID_STATUS_TRANSITIONS[currentStatus] || [];

    if (!validNextStatuses.includes(newStatus)) {
      throw new BadRequestError(
        `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}. ` +
        `Các trạng thái hợp lệ: ${validNextStatuses.join(', ') || 'không có'}`
      );
    }

    // 3. Update order
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });

    // 4. Notify customer about status change (only if order has userId)
    if (order.userId) {
      await notificationService.notifyOrderStatus(order.userId, orderId, newStatus);
    }

    // 5. Return updated order
    return this.getById(orderId, '', true);
  },

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
  async updatePaymentStatus(
    orderId: string,
    data: UpdatePaymentStatusDto
  ): Promise<OrderWithDetails> {
    const { paymentStatus } = data;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    // Update payment status
    await prisma.$transaction(async (tx) => {
      // Update order
      await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus },
      });

      // Update transaction status
      if (paymentStatus === 'PAID') {
        await tx.transaction.updateMany({
          where: { orderId },
          data: { status: 'SUCCESS' },
        });
      } else if (paymentStatus === 'REFUNDED') {
        await tx.transaction.updateMany({
          where: { orderId },
          data: { status: 'FAILED' },
        });
      }
    });

    return this.getById(orderId, '', true);
  },

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
  async cancel(
    orderId: string,
    userId: string,
    isAdmin: boolean = false,
    data?: CancelOrderDto
  ): Promise<OrderWithDetails> {
    // 1. Tìm order với details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    // 2. Check quyền hủy
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenError('Bạn không có quyền hủy đơn hàng này');
    }

    // 3. Validate có thể hủy không
    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      throw new BadRequestError(
        `Không thể hủy đơn hàng có trạng thái ${order.status}. ` +
        `Chỉ có thể hủy khi đơn hàng đang ở trạng thái: ${cancellableStatuses.join(', ')}`
      );
    }

    // 4. Cancel order và hoàn stock trong transaction
    await prisma.$transaction(async (tx) => {
      // 4.1 Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          note: data?.reason
            ? `${order.note ? order.note + ' | ' : ''}Lý do hủy: ${data.reason}`
            : order.note,
        },
      });

      // 4.2 Hoàn lại stock cho từng product
      for (const detail of order.details) {
        await tx.product.update({
          where: { id: detail.productId },
          data: {
            stockQuantity: {
              increment: detail.quantity,
            },
          },
        });
      }

      // 4.3 Update transaction status
      await tx.transaction.updateMany({
        where: { orderId },
        data: { status: 'FAILED' },
      });
    });

    // 5. Notify customer about cancellation (only if order has userId)
    if (order.userId) {
      await notificationService.notifyOrderStatus(order.userId, orderId, 'CANCELLED');
    }

    return this.getById(orderId, userId, isAdmin);
  },
};
