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
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=admin.routes.d.ts.map