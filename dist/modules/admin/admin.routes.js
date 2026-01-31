/**
 * =============================================================================
 * ADMIN.ROUTES.TS - Định nghĩa Routes cho Admin Module
 * =============================================================================
 *
 * IMPORTANT: Tất cả routes đều require ADMIN role
 *
 * ENDPOINTS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path                        │ Description                     │
 * ├────────┼─────────────────────────────┼─────────────────────────────────┤
 * │ GET    │ /api/admin/dashboard        │ Dashboard summary với stats     │
 * │ GET    │ /api/admin/orders           │ List tất cả orders              │
 * │ GET    │ /api/admin/users            │ List tất cả users               │
 * │ PUT    │ /api/admin/users/:id/status │ Cập nhật status user            │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Note: Order status update sử dụng /api/orders/:id/status (order.routes.ts)
 */
import { Router } from 'express';
import { adminController } from './admin.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate, validateQuery } from '../../middleware/validate.js';
import { dashboardQuerySchema, adminOrdersQuerySchema, adminUsersQuerySchema, updateUserStatusSchema, } from './admin.schema.js';
const router = Router();
// ============================================================================
// ALL ROUTES REQUIRE ADMIN ROLE
// ============================================================================
router.use(authenticate);
router.use(authorize('ADMIN'));
// ============================================================================
// DASHBOARD
// ============================================================================
/**
 * GET /api/admin/dashboard
 * Dashboard summary với stats, charts, recent data
 *
 * Query params:
 * - startDate: YYYY-MM-DD (optional)
 * - endDate: YYYY-MM-DD (optional)
 */
router.get('/dashboard', validateQuery(dashboardQuerySchema), adminController.getDashboard);
// Alias cho FE cũ
router.get('/dashboard/summary', validateQuery(dashboardQuerySchema), adminController.getDashboard);
// ============================================================================
// ORDER MANAGEMENT
// ============================================================================
/**
 * GET /api/admin/orders
 * List tất cả orders với filters
 */
router.get('/orders', validateQuery(adminOrdersQuerySchema), adminController.listOrders);
// ============================================================================
// USER MANAGEMENT
// ============================================================================
/**
 * GET /api/admin/users
 * List tất cả users với filters
 */
router.get('/users', validateQuery(adminUsersQuerySchema), adminController.listUsers);
/**
 * PUT /api/admin/users/:id/status
 * Cập nhật status user (ban/activate)
 */
router.put('/users/:id/status', validate(updateUserStatusSchema), adminController.updateUserStatus);
export default router;
//# sourceMappingURL=admin.routes.js.map