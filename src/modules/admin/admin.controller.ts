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
import { adminService } from './admin.service.js';

export const adminController = {
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
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await adminService.getDashboardSummary(req.query as any);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * =========================================================================
   * LIST ALL ORDERS
   * =========================================================================
   * 
   * Route: GET /api/admin/orders
   * Query: ?status=PENDING&page=1&limit=20
   */
  async listOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listOrders(req.query as any);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * =========================================================================
   * LIST ALL USERS
   * =========================================================================
   * 
   * Route: GET /api/admin/users
   * Query: ?status=ACTIVE&role=CUSTOMER&page=1
   */
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.listUsers(req.query as any);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * =========================================================================
   * UPDATE USER STATUS
   * =========================================================================
   * 
   * Route: PUT /api/admin/users/:id/status
   * Body: { status: "ACTIVE" | "INACTIVE" | "BANNED" }
   */
  async updateUserStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await adminService.updateUserStatus(id, req.body);

      res.json({
        success: true,
        data: user,
        message: `Đã cập nhật trạng thái user thành ${req.body.status}`,
      });
    } catch (error) {
      next(error);
    }
  },
};
