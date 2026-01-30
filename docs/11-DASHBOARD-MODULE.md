# Bước 11: Dashboard Module (Analytics)

## 11.1. Tổng Quan

Module Dashboard cung cấp:
- **Overview Stats** - Tổng quan (doanh thu, đơn hàng, users)
- **Revenue Chart** - Biểu đồ doanh thu
- **Top Products** - Sản phẩm bán chạy
- **Recent Orders** - Đơn hàng gần đây

---

## 11.2. Dashboard Service

Tạo `src/modules/dashboard/dashboard.service.js`:

```javascript
import prisma from '../../database/prisma.js';

export const dashboardService = {
  /**
   * Lấy tổng quan
   */
  async getOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // Thống kê đơn hàng
    const [totalOrders, todayOrders, pendingOrders] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { status: 'PENDING' } })
    ]);

    // Doanh thu tháng này
    const thisMonthRevenue = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: thisMonth }
      },
      _sum: { totalMoney: true }
    });

    // Doanh thu tháng trước (để so sánh)
    const lastMonthRevenue = await prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: lastMonth,
          lte: lastMonthEnd
        }
      },
      _sum: { totalMoney: true }
    });

    // Users
    const [totalUsers, newUsersToday] = await Promise.all([
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { createdAt: { gte: today } } })
    ]);

    // Products
    const [totalProducts, lowStockProducts] = await Promise.all([
      prisma.product.count({ where: { status: 'PUBLISHED' } }),
      prisma.product.count({ 
        where: { 
          status: 'PUBLISHED', 
          stockQuantity: { lt: 10 } 
        } 
      })
    ]);

    // Tính growth rate
    const currentRevenue = Number(thisMonthRevenue._sum.totalMoney || 0);
    const previousRevenue = Number(lastMonthRevenue._sum.totalMoney || 0);
    const revenueGrowth = previousRevenue > 0 
      ? ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1)
      : 0;

    return {
      orders: {
        total: totalOrders,
        today: todayOrders,
        pending: pendingOrders
      },
      revenue: {
        thisMonth: currentRevenue,
        lastMonth: previousRevenue,
        growth: parseFloat(revenueGrowth)
      },
      users: {
        total: totalUsers,
        newToday: newUsersToday
      },
      products: {
        total: totalProducts,
        lowStock: lowStockProducts
      }
    };
  },

  /**
   * Biểu đồ doanh thu theo ngày (30 ngày gần nhất)
   */
  async getRevenueChart(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      select: {
        totalMoney: true,
        createdAt: true
      }
    });

    // Group by date
    const revenueByDate = {};
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(order.totalMoney);
    });

    // Fill missing dates
    const result = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        revenue: revenueByDate[dateStr] || 0
      });
    }

    return result;
  },

  /**
   * Top sản phẩm bán chạy
   */
  async getTopProducts(limit = 10) {
    const topProducts = await prisma.orderDetail.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit
    });

    const productIds = topProducts.map(p => p.productId);
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        images: { where: { isThumbnail: true }, take: 1 }
      }
    });

    return topProducts.map(tp => {
      const product = products.find(p => p.id === tp.productId);
      return {
        id: product?.id,
        name: product?.name,
        thumbnail: product?.images[0]?.imageUrl,
        price: product?.price,
        totalSold: tp._sum.quantity
      };
    });
  },

  /**
   * Đơn hàng gần đây
   */
  async getRecentOrders(limit = 10) {
    return prisma.order.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        _count: { select: { details: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  },

  /**
   * Thống kê theo trạng thái đơn hàng
   */
  async getOrdersByStatus() {
    const stats = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const result = {};
    stats.forEach(s => {
      result[s.status] = s._count.id;
    });

    return result;
  }
};
```

---

## 11.3. Dashboard Controller & Routes

Tạo `src/modules/dashboard/dashboard.controller.js`:

```javascript
import { dashboardService } from './dashboard.service.js';

export const dashboardController = {
  async getOverview(req, res, next) {
    try {
      const data = await dashboardService.getOverview();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getRevenueChart(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 30;
      const data = await dashboardService.getRevenueChart(days);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getTopProducts(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data = await dashboardService.getTopProducts(limit);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getRecentOrders(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const data = await dashboardService.getRecentOrders(limit);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getOrdersByStatus(req, res, next) {
    try {
      const data = await dashboardService.getOrdersByStatus();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
};
```

Tạo `src/modules/dashboard/dashboard.routes.js`:

```javascript
import { Router } from 'express';
import { dashboardController } from './dashboard.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Chỉ Admin
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/overview', dashboardController.getOverview);
router.get('/revenue-chart', dashboardController.getRevenueChart);
router.get('/top-products', dashboardController.getTopProducts);
router.get('/recent-orders', dashboardController.getRecentOrders);
router.get('/orders-by-status', dashboardController.getOrdersByStatus);

export default router;
```

---

## ✅ Checklist Bước 11

- [ ] Đã tạo dashboard service, controller, routes
- [ ] Test: GET /api/dashboard/overview
- [ ] Test: GET /api/dashboard/revenue-chart
- [ ] Test: GET /api/dashboard/top-products

---

**Tiếp theo:** [12-MIDDLEWARE.md](./12-MIDDLEWARE.md)
