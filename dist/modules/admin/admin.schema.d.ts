/**
 * =============================================================================
 * ADMIN.SCHEMA.TS - Validation Schemas cho Admin Module
 * =============================================================================
 *
 * Các schemas cho Admin APIs:
 * - Dashboard query (date range filter)
 * - Order management (status updates)
 * - User management (status updates)
 */
import { z } from 'zod';
/**
 * Schema cho query dashboard summary
 *
 * QUERY PARAMS:
 * - startDate: YYYY-MM-DD (optional)
 * - endDate: YYYY-MM-DD (optional)
 *
 * Nếu không truyền dates, mặc định lấy 30 ngày gần nhất
 */
export declare const dashboardQuerySchema: z.ZodObject<{
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    endDate?: string | undefined;
}>;
export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;
/**
 * Schema cho list orders với filters
 */
export declare const adminOrdersQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"]>>;
    paymentStatus: z.ZodOptional<z.ZodEnum<["UNPAID", "PAID", "REFUNDED"]>>;
    search: z.ZodOptional<z.ZodString>;
    fromDate: z.ZodOptional<z.ZodString>;
    toDate: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "totalMoney", "status"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy: "status" | "createdAt" | "totalMoney";
    search?: string | undefined;
    status?: "CONFIRMED" | "CANCELLED" | "PENDING" | "SHIPPING" | "COMPLETED" | undefined;
    paymentStatus?: "UNPAID" | "PAID" | "REFUNDED" | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}, {
    search?: string | undefined;
    status?: "CONFIRMED" | "CANCELLED" | "PENDING" | "SHIPPING" | "COMPLETED" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "status" | "createdAt" | "totalMoney" | undefined;
    paymentStatus?: "UNPAID" | "PAID" | "REFUNDED" | undefined;
    fromDate?: string | undefined;
    toDate?: string | undefined;
}>;
export type AdminOrdersQueryDto = z.infer<typeof adminOrdersQuerySchema>;
/**
 * Schema cho list users với filters
 */
export declare const adminUsersQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "BANNED"]>>;
    role: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "fullName", "email"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy: "email" | "fullName" | "createdAt";
    search?: string | undefined;
    role?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "BANNED" | undefined;
}, {
    search?: string | undefined;
    role?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "BANNED" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    sortBy?: "email" | "fullName" | "createdAt" | undefined;
}>;
export type AdminUsersQueryDto = z.infer<typeof adminUsersQuerySchema>;
/**
 * Schema cập nhật status user
 */
export declare const updateUserStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["ACTIVE", "INACTIVE", "BANNED"]>;
}, "strip", z.ZodTypeAny, {
    status: "ACTIVE" | "INACTIVE" | "BANNED";
}, {
    status: "ACTIVE" | "INACTIVE" | "BANNED";
}>;
export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;
export interface DashboardStats {
    revenue: {
        value: number;
        trend: number;
        paid: number;
        pending: number;
    };
    orders: {
        value: number;
        trend: number;
    };
    customers: {
        value: number;
        trend: number;
    };
    lowStock: {
        value: number;
    };
}
export interface DashboardSummary {
    stats: DashboardStats;
    revenueChart: Array<{
        date: string;
        revenue: number;
    }>;
    categoryChart: Array<{
        name: string;
        value: number;
    }>;
    topProducts: Array<{
        name: string;
        sold: number;
        stock: number;
        image: string | null;
        percent: number;
    }>;
    recentOrders: Array<{
        id: string;
        customer: string;
        total: number;
        date: string;
        status: string;
    }>;
    latestReviews: Array<{
        userName: string;
        avatar: string | null;
        rating: number;
        comment: string;
        createdAt: string;
    }>;
}
//# sourceMappingURL=admin.schema.d.ts.map