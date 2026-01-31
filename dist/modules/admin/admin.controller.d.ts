/**
 * =============================================================================
 * ADMIN.CONTROLLER.TS - Request Handlers cho Admin Module
 * =============================================================================
 *
 * Controller này xử lý các admin endpoints:
 * - GET /api/admin/dashboard - Dashboard summary
 * - GET /api/admin/orders - List all orders
 * - GET /api/admin/users - List all users
 * - PUT /api/admin/users/:id/status - Update user status
 */
import { Request, Response, NextFunction } from 'express';
export declare const adminController: {
    /**
     * =========================================================================
     * GET DASHBOARD SUMMARY
     * =========================================================================
     *
     * Route: GET /api/admin/dashboard
     * Query: ?startDate=2024-01-01&endDate=2024-01-31
     *
     * Returns:
     * - Stats overview (revenue, orders, customers, low stock)
     * - Revenue chart data
     * - Category breakdown
     * - Top products
     * - Recent orders
     * - Latest reviews
     */
    getDashboard(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * =========================================================================
     * LIST ALL ORDERS
     * =========================================================================
     *
     * Route: GET /api/admin/orders
     * Query: ?status=PENDING&page=1&limit=20
     */
    listOrders(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * =========================================================================
     * LIST ALL USERS
     * =========================================================================
     *
     * Route: GET /api/admin/users
     * Query: ?status=ACTIVE&role=CUSTOMER&page=1
     */
    listUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * =========================================================================
     * UPDATE USER STATUS
     * =========================================================================
     *
     * Route: PUT /api/admin/users/:id/status
     * Body: { status: "ACTIVE" | "INACTIVE" | "BANNED" }
     */
    updateUserStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=admin.controller.d.ts.map