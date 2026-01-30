/**
 * Mock Data: Dashboard Module (Admin)
 * - GET /api/dashboard/overview
 * - GET /api/dashboard/revenue-chart
 * - GET /api/dashboard/top-products
 * - GET /api/dashboard/recent-orders
 * - GET /api/dashboard/orders-by-status
 */

// ============ OVERVIEW ============

export const getOverviewSuccess = {
  endpoint: "GET /api/dashboard/overview",
  description: "Lấy thống kê tổng quan",
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: {
      orders: {
        total: 1250,
        today: 15,
        pending: 45
      },
      revenue: {
        thisMonth: 125000000,
        lastMonth: 98000000,
        growth: 27.6
      },
      users: {
        total: 850,
        newToday: 5
      },
      products: {
        total: 120,
        lowStock: 8
      }
    }
  },
  statusCode: 200
};

// ============ REVENUE CHART ============

export const getRevenueChartSuccess = {
  endpoint: "GET /api/dashboard/revenue-chart",
  description: "Biểu đồ doanh thu 30 ngày",
  query: { days: 30 },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: [
      { date: "2026-01-01", revenue: 3500000 },
      { date: "2026-01-02", revenue: 4200000 },
      { date: "2026-01-03", revenue: 0 },
      { date: "2026-01-04", revenue: 5800000 },
      // ... more days
      { date: "2026-01-30", revenue: 6200000 }
    ]
  },
  statusCode: 200
};

export const getRevenueChart7Days = {
  endpoint: "GET /api/dashboard/revenue-chart",
  description: "Biểu đồ 7 ngày gần nhất",
  query: { days: 7 },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: [
      { date: "2026-01-24", revenue: 5500000 },
      { date: "2026-01-25", revenue: 4800000 },
      { date: "2026-01-26", revenue: 3200000 },
      { date: "2026-01-27", revenue: 7100000 },
      { date: "2026-01-28", revenue: 6500000 },
      { date: "2026-01-29", revenue: 8200000 },
      { date: "2026-01-30", revenue: 4300000 }
    ]
  },
  statusCode: 200
};

// ============ TOP PRODUCTS ============

export const getTopProductsSuccess = {
  endpoint: "GET /api/dashboard/top-products",
  description: "Top 10 sản phẩm bán chạy",
  query: { limit: 10 },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: [
      {
        id: "prod-uuid-1",
        name: "Trà Ô Long Đài Loan",
        thumbnail: "https://cdn.example.com/tea1.jpg",
        price: 250000,
        totalSold: 456
      },
      {
        id: "prod-uuid-2",
        name: "Trà Ô Long Thiết Quan Âm",
        thumbnail: "https://cdn.example.com/tea2.jpg",
        price: 350000,
        totalSold: 312
      },
      {
        id: "prod-uuid-3",
        name: "Trà Xanh Thái Nguyên",
        thumbnail: "https://cdn.example.com/tea3.jpg",
        price: 180000,
        totalSold: 289
      },
      // ... more products
    ]
  },
  statusCode: 200
};

// ============ RECENT ORDERS ============

export const getRecentOrdersSuccess = {
  endpoint: "GET /api/dashboard/recent-orders",
  description: "10 đơn hàng gần nhất",
  query: { limit: 10 },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: [
      {
        id: "order-uuid-1",
        totalMoney: 830000,
        status: "PENDING",
        paymentStatus: "UNPAID",
        createdAt: "2026-01-30T10:30:00.000Z",
        user: { fullName: "Nguyễn Văn A", email: "customer1@example.com" },
        _count: { details: 3 }
      },
      {
        id: "order-uuid-2",
        totalMoney: 450000,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        createdAt: "2026-01-30T09:15:00.000Z",
        user: { fullName: "Trần Thị B", email: "customer2@example.com" },
        _count: { details: 2 }
      },
      // ... more orders
    ]
  },
  statusCode: 200
};

// ============ ORDERS BY STATUS ============

export const getOrdersByStatusSuccess = {
  endpoint: "GET /api/dashboard/orders-by-status",
  description: "Thống kê đơn hàng theo trạng thái",
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: {
      PENDING: 45,
      CONFIRMED: 23,
      SHIPPING: 67,
      COMPLETED: 1089,
      CANCELLED: 26
    }
  },
  statusCode: 200
};

// ============ AUTHORIZATION ============

export const dashboardForbidden = {
  endpoint: "GET /api/dashboard/overview",
  description: "Không phải Admin",
  headers: { Authorization: "Bearer customer-token" },
  response: {
    success: false,
    message: "Không có quyền truy cập"
  },
  statusCode: 403
};

export const dashboardUnauthorized = {
  endpoint: "GET /api/dashboard/overview",
  description: "Chưa đăng nhập",
  headers: {},
  response: {
    success: false,
    message: "Vui lòng đăng nhập"
  },
  statusCode: 401
};
