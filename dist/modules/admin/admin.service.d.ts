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
import type { DashboardQueryDto, DashboardSummary, AdminOrdersQueryDto, AdminUsersQueryDto, UpdateUserStatusDto } from './admin.schema.js';
export declare const adminService: {
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
    getDashboardSummary(query: DashboardQueryDto): Promise<DashboardSummary>;
    /**
     * =========================================================================
     * LIST ALL ORDERS (Admin)
     * =========================================================================
     */
    listOrders(query: AdminOrdersQueryDto): Promise<{
        orders: {
            id: string;
            customer: string;
            email: string | undefined;
            phone: string;
            address: string;
            total: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            itemCount: number;
            createdAt: string;
            items: {
                name: string;
                image: string;
                price: number;
                quantity: number;
            }[];
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * =========================================================================
     * LIST ALL USERS (Admin)
     * =========================================================================
     */
    listUsers(query: AdminUsersQueryDto): Promise<{
        users: {
            id: string;
            email: string;
            fullName: string | null;
            phone: string | null;
            status: import(".prisma/client").$Enums.UserStatus;
            role: string;
            orderCount: number;
            createdAt: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    /**
     * =========================================================================
     * UPDATE USER STATUS
     * =========================================================================
     */
    updateUserStatus(userId: string, data: UpdateUserStatusDto): Promise<{
        email: string;
        fullName: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
    }>;
};
//# sourceMappingURL=admin.service.d.ts.map