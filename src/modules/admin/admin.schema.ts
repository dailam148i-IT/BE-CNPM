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

// ============================================================================
// DASHBOARD SCHEMAS
// ============================================================================

/**
 * Schema cho query dashboard summary
 * 
 * QUERY PARAMS:
 * - startDate: YYYY-MM-DD (optional)
 * - endDate: YYYY-MM-DD (optional)
 * 
 * Nếu không truyền dates, mặc định lấy 30 ngày gần nhất
 */
export const dashboardQuerySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có format YYYY-MM-DD')
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có format YYYY-MM-DD')
    .optional(),
});

export type DashboardQueryDto = z.infer<typeof dashboardQuerySchema>;

// ============================================================================
// ORDER MANAGEMENT SCHEMAS
// ============================================================================

/**
 * Schema cho list orders với filters
 */
export const adminOrdersQuerySchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'REFUNDED']).optional(),
  search: z.string().optional(), // Search by order ID, customer name, phone
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'totalMoney', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminOrdersQueryDto = z.infer<typeof adminOrdersQuerySchema>;

// ============================================================================
// USER MANAGEMENT SCHEMAS
// ============================================================================

/**
 * Schema cho list users với filters
 */
export const adminUsersQuerySchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED']).optional(),
  role: z.string().optional(),
  search: z.string().optional(), // Search by name, email, phone
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'fullName', 'email']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AdminUsersQueryDto = z.infer<typeof adminUsersQuerySchema>;

/**
 * Schema cập nhật status user
 */
export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'BANNED'], {
    message: 'Status phải là ACTIVE, INACTIVE hoặc BANNED',
  }),
});

export type UpdateUserStatusDto = z.infer<typeof updateUserStatusSchema>;

// ============================================================================
// RESPONSE TYPES
// ============================================================================

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
  revenueChart: Array<{ date: string; revenue: number }>;
  categoryChart: Array<{ name: string; value: number }>;
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
