/**
 * =============================================================================
 * ADMIN.SERVICE.TS - Business Logic cho Admin Module
 * =============================================================================
 *
 * Service này xử lý:
 * - Dashboard statistics (revenue, orders, customers, low stock)
 * - Revenue chart data
 * - Top products by sales
 * - Recent orders
 * - Latest reviews
 * - User management
 */
import prisma from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
/**
 * Tính % thay đổi so với kỳ trước
 */
function calculateTrend(current, previous) {
    if (previous === 0)
        return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}
/**
 * Parse date range, mặc định 30 ngày gần nhất
 */
function getDateRange(startDate, endDate) {
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    const start = startDate
        ? new Date(startDate)
        : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    start.setHours(0, 0, 0, 0);
    // Previous period (same length)
    const periodLength = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    prevEnd.setHours(23, 59, 59, 999);
    const prevStart = new Date(prevEnd.getTime() - periodLength);
    return { start, end, prevStart, prevEnd };
}
// ============================================================================
// SERVICE OBJECT
// ============================================================================
export const adminService = {
    /**
     * =========================================================================
     * GET DASHBOARD SUMMARY
     * =========================================================================
     *
     * Trả về tất cả data cần cho admin dashboard:
     * - Stats overview (revenue, orders, customers, low stock)
     * - Revenue chart (theo ngày)
     * - Category breakdown
     * - Top selling products
     * - Recent orders
     * - Latest reviews
     */
    async getDashboardSummary(query) {
        const { start, end, prevStart, prevEnd } = getDateRange(query.startDate, query.endDate);
        // -----------------------------------------------------------------------
        // 1. Current period stats
        // -----------------------------------------------------------------------
        const [currentRevenue, currentOrders, currentCustomers, previousRevenue, previousOrders, previousCustomers, lowStockCount, paidRevenue, pendingRevenue,] = await Promise.all([
            // Current period revenue
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: start, lte: end },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalMoney: true },
            }),
            // Current period orders count
            prisma.order.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
            // Current period new customers
            prisma.user.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            }),
            // Previous period revenue
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: prevStart, lte: prevEnd },
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalMoney: true },
            }),
            // Previous period orders
            prisma.order.count({
                where: {
                    createdAt: { gte: prevStart, lte: prevEnd },
                },
            }),
            // Previous period customers
            prisma.user.count({
                where: {
                    createdAt: { gte: prevStart, lte: prevEnd },
                },
            }),
            // Low stock products (< 10 items)
            prisma.product.count({
                where: {
                    stockQuantity: { lt: 10 },
                    status: 'PUBLISHED',
                },
            }),
            // Paid revenue
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: start, lte: end },
                    paymentStatus: 'PAID',
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalMoney: true },
            }),
            // Pending revenue
            prisma.order.aggregate({
                where: {
                    createdAt: { gte: start, lte: end },
                    paymentStatus: 'UNPAID',
                    status: { not: 'CANCELLED' },
                },
                _sum: { totalMoney: true },
            }),
        ]);
        const currentRevenueValue = Number(currentRevenue._sum.totalMoney ?? 0);
        const previousRevenueValue = Number(previousRevenue._sum.totalMoney ?? 0);
        // -----------------------------------------------------------------------
        // 2. Revenue chart (group by date)
        // -----------------------------------------------------------------------
        const revenueByDate = await prisma.$queryRaw `
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN status != 'CANCELLED' THEN total_money ELSE 0 END) as revenue
      FROM orders
      WHERE created_at >= ${start} AND created_at <= ${end}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;
        const revenueChart = revenueByDate.map((row) => ({
            date: row.date.toISOString().split('T')[0],
            revenue: Number(row.revenue ?? 0),
        }));
        // -----------------------------------------------------------------------
        // 3. Category breakdown
        // -----------------------------------------------------------------------
        const categoryStats = await prisma.$queryRaw `
      SELECT 
        c.name,
        COALESCE(SUM(od.quantity), 0) as value
      FROM categories c
      LEFT JOIN products p ON p.category_id = c.id
      LEFT JOIN order_details od ON od.product_id = p.id
      LEFT JOIN orders o ON o.id = od.order_id
      WHERE (o.created_at >= ${start} AND o.created_at <= ${end} AND o.status != 'CANCELLED')
         OR o.id IS NULL
      GROUP BY c.id, c.name
      ORDER BY value DESC
      LIMIT 5
    `;
        const categoryChart = categoryStats.map((row) => ({
            name: row.name,
            value: Number(row.value),
        }));
        // -----------------------------------------------------------------------
        // 4. Top products by sales
        // -----------------------------------------------------------------------
        const topProductsRaw = await prisma.$queryRaw `
      SELECT 
        p.name,
        COALESCE(SUM(od.quantity), 0) as sold,
        p.stock_quantity as stock,
        (SELECT image_url FROM product_images pi WHERE pi.product_id = p.id AND pi.is_thumbnail = 1 LIMIT 1) as image
      FROM products p
      LEFT JOIN order_details od ON od.product_id = p.id
      LEFT JOIN orders o ON o.id = od.order_id AND o.status != 'CANCELLED'
      WHERE p.status = 'PUBLISHED'
      GROUP BY p.id, p.name, p.stock_quantity
      ORDER BY sold DESC
      LIMIT 5
    `;
        const maxSold = Math.max(...topProductsRaw.map((p) => Number(p.sold)), 1);
        const topProducts = topProductsRaw.map((p) => ({
            name: p.name,
            sold: Number(p.sold),
            stock: Number(p.stock),
            image: p.image,
            percent: Math.round((Number(p.sold) / maxSold) * 100),
        }));
        // -----------------------------------------------------------------------
        // 5. Recent orders
        // -----------------------------------------------------------------------
        const recentOrdersRaw = await prisma.order.findMany({
            where: {
                createdAt: { gte: start, lte: end },
            },
            include: {
                user: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        const recentOrders = recentOrdersRaw.map((order) => ({
            id: order.id,
            customer: order.user?.fullName ?? 'Khách vãng lai',
            total: Number(order.totalMoney),
            date: order.createdAt.toISOString(),
            status: order.status,
        }));
        // -----------------------------------------------------------------------
        // 6. Latest reviews
        // -----------------------------------------------------------------------
        const latestReviewsRaw = await prisma.review.findMany({
            include: {
                user: {
                    select: {
                        fullName: true,
                        // avatar: true, // Nếu có field avatar
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const latestReviews = latestReviewsRaw.map((review) => ({
            userName: review.user.fullName ?? 'Ẩn danh',
            avatar: null, // Placeholder, thêm nếu có field
            rating: review.rating,
            comment: review.commentText ?? '',
            createdAt: review.createdAt.toISOString(),
        }));
        // -----------------------------------------------------------------------
        // 7. Build response
        // -----------------------------------------------------------------------
        return {
            stats: {
                revenue: {
                    value: currentRevenueValue,
                    trend: calculateTrend(currentRevenueValue, previousRevenueValue),
                    paid: Number(paidRevenue._sum.totalMoney ?? 0),
                    pending: Number(pendingRevenue._sum.totalMoney ?? 0),
                },
                orders: {
                    value: currentOrders,
                    trend: calculateTrend(currentOrders, previousOrders),
                },
                customers: {
                    value: currentCustomers,
                    trend: calculateTrend(currentCustomers, previousCustomers),
                },
                lowStock: {
                    value: lowStockCount,
                },
            },
            revenueChart,
            categoryChart,
            topProducts,
            recentOrders,
            latestReviews,
        };
    },
    /**
     * =========================================================================
     * LIST ALL ORDERS (Admin)
     * =========================================================================
     */
    async listOrders(query) {
        const { status, paymentStatus, search, fromDate, toDate, page, limit, sortBy, sortOrder } = query;
        const where = {};
        if (status)
            where.status = status;
        if (paymentStatus)
            where.paymentStatus = paymentStatus;
        if (fromDate || toDate) {
            where.createdAt = {};
            if (fromDate)
                where.createdAt.gte = new Date(fromDate);
            if (toDate) {
                const end = new Date(toDate);
                end.setHours(23, 59, 59, 999);
                where.createdAt.lte = end;
            }
        }
        if (search) {
            where.OR = [
                { id: { contains: search } },
                { shippingPhone: { contains: search } },
                { user: { fullName: { contains: search } } },
            ];
        }
        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, fullName: true, email: true, phone: true },
                    },
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
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.order.count({ where }),
        ]);
        return {
            orders: orders.map((order) => ({
                id: order.id,
                customer: order.user?.fullName ?? 'Khách',
                email: order.user?.email,
                phone: order.shippingPhone,
                address: order.shippingAddress,
                total: Number(order.totalMoney),
                status: order.status,
                paymentStatus: order.paymentStatus,
                itemCount: order.details.length,
                createdAt: order.createdAt.toISOString(),
                items: order.details.map((d) => ({
                    name: d.product.name,
                    image: d.product.images[0]?.imageUrl ?? null,
                    price: Number(d.price),
                    quantity: d.quantity,
                })),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    },
    /**
     * =========================================================================
     * LIST ALL USERS (Admin)
     * =========================================================================
     */
    async listUsers(query) {
        const { status, role, search, page, limit, sortBy, sortOrder } = query;
        const where = {};
        if (status)
            where.status = status;
        if (role)
            where.role = { name: role };
        if (search) {
            where.OR = [
                { fullName: { contains: search } },
                { email: { contains: search } },
                { phone: { contains: search } },
            ];
        }
        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    fullName: true,
                    phone: true,
                    status: true,
                    createdAt: true,
                    role: {
                        select: { name: true },
                    },
                    _count: {
                        select: { orders: true },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.user.count({ where }),
        ]);
        return {
            users: users.map((u) => ({
                id: u.id,
                email: u.email,
                fullName: u.fullName,
                phone: u.phone,
                status: u.status,
                role: u.role?.name ?? 'CUSTOMER',
                orderCount: u._count.orders,
                createdAt: u.createdAt.toISOString(),
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    },
    /**
     * =========================================================================
     * UPDATE USER STATUS
     * =========================================================================
     */
    async updateUserStatus(userId, data) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new NotFoundError('Không tìm thấy người dùng');
        }
        const updated = await prisma.user.update({
            where: { id: userId },
            data: { status: data.status },
            select: {
                id: true,
                email: true,
                fullName: true,
                status: true,
            },
        });
        return updated;
    },
};
//# sourceMappingURL=admin.service.js.map