/**
 * Mock Data: Orders Module
 * - POST /api/orders/checkout
 * - GET /api/orders/my-orders
 * - GET /api/orders/my-orders/:id
 * - GET /api/orders (Admin)
 * - PUT /api/orders/:id/status (Admin)
 * - PUT /api/orders/:id/payment-status (Admin)
 */

// ============ SAMPLE ORDER ============

export const sampleOrder = {
  id: "order-uuid-1",
  userId: "user-uuid-1",
  subtotal: 850000,
  shippingFee: 30000,
  discountAmount: 50000,
  totalMoney: 830000,
  status: "PENDING",
  paymentStatus: "UNPAID",
  shippingAddress: "123 Đường ABC, Phường 1, Quận 1, TP.HCM",
  shippingPhone: "0901234567",
  note: "Giao giờ hành chính",
  createdAt: "2026-01-30T10:00:00.000Z",
  user: {
    fullName: "Nguyễn Văn A",
    email: "customer@example.com",
    phone: "0901234567"
  },
  details: [
    {
      id: "detail-1",
      orderId: "order-uuid-1",
      productId: "prod-uuid-1",
      price: 250000,
      quantity: 2,
      product: {
        id: "prod-uuid-1",
        name: "Trà Ô Long Đài Loan",
        slug: "tra-o-long-dai-loan",
        images: [{ imageUrl: "https://cdn.example.com/tea1.jpg" }]
      }
    },
    {
      id: "detail-2",
      orderId: "order-uuid-1",
      productId: "prod-uuid-2",
      price: 350000,
      quantity: 1,
      product: {
        id: "prod-uuid-2",
        name: "Trà Ô Long Thiết Quan Âm",
        slug: "tra-o-long-thiet-quan-am",
        images: [{ imageUrl: "https://cdn.example.com/tea2.jpg" }]
      }
    }
  ],
  transactions: []
};

// ============ CHECKOUT ============

export const checkoutSuccess = {
  endpoint: "POST /api/orders/checkout",
  description: "Đặt hàng thành công",
  headers: { Authorization: "Bearer user-token" },
  request: {
    shippingAddress: "123 Đường ABC, Phường 1, Quận 1, TP.HCM",
    shippingPhone: "0901234567",
    note: "Giao giờ hành chính",
    shippingFee: 30000,
    discountAmount: 50000
  },
  response: {
    success: true,
    data: sampleOrder
  },
  statusCode: 201
};

export const checkoutEmptyCart = {
  endpoint: "POST /api/orders/checkout",
  description: "Giỏ hàng trống",
  headers: { Authorization: "Bearer user-token" },
  request: {
    shippingAddress: "123 ABC",
    shippingPhone: "0901234567"
  },
  response: {
    success: false,
    message: "Giỏ hàng trống"
  },
  statusCode: 400
};

export const checkoutOutOfStock = {
  endpoint: "POST /api/orders/checkout",
  description: "Sản phẩm hết hàng khi checkout",
  headers: { Authorization: "Bearer user-token" },
  request: {
    shippingAddress: "123 ABC",
    shippingPhone: "0901234567"
  },
  response: {
    success: false,
    message: 'Sản phẩm "Trà Ô Long Đài Loan" không đủ hàng (còn 0)'
  },
  statusCode: 400
};

export const checkoutProductUnavailable = {
  endpoint: "POST /api/orders/checkout",
  description: "Sản phẩm bị ngừng bán",
  headers: { Authorization: "Bearer user-token" },
  request: {
    shippingAddress: "123 ABC",
    shippingPhone: "0901234567"
  },
  response: {
    success: false,
    message: 'Sản phẩm "Trà XYZ" không còn bán'
  },
  statusCode: 400
};

export const checkoutMissingAddress = {
  endpoint: "POST /api/orders/checkout",
  description: "Thiếu địa chỉ giao hàng",
  headers: { Authorization: "Bearer user-token" },
  request: {
    shippingPhone: "0901234567"
    // Missing shippingAddress
  },
  response: {
    success: false,
    message: "Dữ liệu không hợp lệ",
    errors: [
      { field: "shippingAddress", message: "Địa chỉ giao hàng là bắt buộc" }
    ]
  },
  statusCode: 400
};

// ============ GET MY ORDERS ============

export const getMyOrdersSuccess = {
  endpoint: "GET /api/orders/my-orders",
  description: "Lấy đơn hàng của user",
  headers: { Authorization: "Bearer user-token" },
  query: { page: 1, limit: 10 },
  response: {
    success: true,
    data: {
      orders: [
        {
          id: "order-uuid-1",
          totalMoney: 830000,
          status: "PENDING",
          paymentStatus: "UNPAID",
          createdAt: "2026-01-30T10:00:00.000Z",
          details: [
            { product: { name: "Trà Ô Long", images: [{ imageUrl: "..." }] } }
          ],
          _count: { details: 2 }
        },
        {
          id: "order-uuid-2",
          totalMoney: 500000,
          status: "COMPLETED",
          paymentStatus: "PAID",
          createdAt: "2026-01-15T00:00:00.000Z",
          _count: { details: 1 }
        }
      ],
      pagination: { page: 1, limit: 10, total: 5, totalPages: 1 }
    }
  },
  statusCode: 200
};

export const getMyOrdersFiltered = {
  endpoint: "GET /api/orders/my-orders",
  description: "Lấy đơn hàng theo status",
  headers: { Authorization: "Bearer user-token" },
  query: { status: "COMPLETED" },
  response: {
    success: true,
    data: {
      orders: [/* only completed orders */],
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 }
    }
  },
  statusCode: 200
};

// ============ GET ORDER DETAIL ============

export const getOrderDetailSuccess = {
  endpoint: "GET /api/orders/my-orders/:id",
  description: "Lấy chi tiết đơn hàng",
  params: { id: "order-uuid-1" },
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: true,
    data: sampleOrder
  },
  statusCode: 200
};

export const getOrderDetailNotFound = {
  endpoint: "GET /api/orders/my-orders/:id",
  description: "Đơn hàng không tồn tại hoặc không thuộc user",
  params: { id: "other-user-order" },
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: false,
    message: "Không tìm thấy đơn hàng"
  },
  statusCode: 404
};

// ============ ADMIN: GET ALL ORDERS ============

export const getAllOrdersAdmin = {
  endpoint: "GET /api/orders",
  description: "Admin lấy tất cả đơn hàng",
  headers: { Authorization: "Bearer admin-token" },
  query: { page: 1, limit: 20, status: "PENDING" },
  response: {
    success: true,
    data: {
      orders: [
        {
          id: "order-uuid-1",
          totalMoney: 830000,
          status: "PENDING",
          paymentStatus: "UNPAID",
          createdAt: "2026-01-30T10:00:00.000Z",
          user: { fullName: "Khách hàng 1", email: "customer1@example.com" },
          _count: { details: 2 },
          transactions: []
        }
      ],
      pagination: { page: 1, limit: 20, total: 15, totalPages: 1 }
    }
  },
  statusCode: 200
};

// ============ ADMIN: UPDATE STATUS ============

export const updateOrderStatusSuccess = {
  endpoint: "PUT /api/orders/:id/status",
  description: "Admin cập nhật trạng thái đơn",
  params: { id: "order-uuid-1" },
  headers: { Authorization: "Bearer admin-token" },
  request: { status: "CONFIRMED" },
  response: {
    success: true,
    data: {
      id: "order-uuid-1",
      status: "CONFIRMED"
    }
  },
  statusCode: 200
};

export const updateOrderStatusInvalid = {
  endpoint: "PUT /api/orders/:id/status",
  description: "Trạng thái không hợp lệ",
  params: { id: "order-uuid-1" },
  headers: { Authorization: "Bearer admin-token" },
  request: { status: "INVALID_STATUS" },
  response: {
    success: false,
    message: "Trạng thái không hợp lệ"
  },
  statusCode: 400
};

export const updateCompletedOrder = {
  endpoint: "PUT /api/orders/:id/status",
  description: "Không thể thay đổi đơn đã hoàn thành",
  params: { id: "completed-order" },
  headers: { Authorization: "Bearer admin-token" },
  request: { status: "CANCELLED" },
  response: {
    success: false,
    message: "Không thể thay đổi đơn hàng đã hoàn thành"
  },
  statusCode: 400
};

export const cancelOrderRestoresStock = {
  endpoint: "PUT /api/orders/:id/status",
  description: "Hủy đơn sẽ hoàn lại tồn kho",
  params: { id: "order-uuid-1" },
  headers: { Authorization: "Bearer admin-token" },
  request: { status: "CANCELLED" },
  response: {
    success: true,
    data: {
      id: "order-uuid-1",
      status: "CANCELLED"
    }
  },
  note: "Products stock quantity will be incremented back",
  statusCode: 200
};

// ============ ADMIN: UPDATE PAYMENT STATUS ============

export const updatePaymentStatusSuccess = {
  endpoint: "PUT /api/orders/:id/payment-status",
  description: "Cập nhật trạng thái thanh toán",
  params: { id: "order-uuid-1" },
  headers: { Authorization: "Bearer admin-token" },
  request: { paymentStatus: "PAID" },
  response: {
    success: true,
    data: {
      id: "order-uuid-1",
      paymentStatus: "PAID"
    }
  },
  statusCode: 200
};
