/**
 * =============================================================================
 * USER.ROUTES.TS - API Routes cho quản lý Users (Admin only)
 * =============================================================================
 *
 * ADMIN ROUTES:
 * - GET    /api/admin/users           - Danh sách users
 * - GET    /api/admin/users/:id       - Chi tiết user
 * - PUT    /api/admin/users/:id/status - Block/Unblock user
 * - PUT    /api/admin/users/:id/role   - Thay đổi role
 * - GET    /api/admin/roles           - Danh sách roles
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=user.routes.d.ts.map