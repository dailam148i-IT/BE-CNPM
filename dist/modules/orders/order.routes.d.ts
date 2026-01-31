/**
 * =============================================================================
 * ORDER.ROUTES.TS - Định nghĩa Routes cho Order Module
 * =============================================================================
 *
 * File này định nghĩa các API endpoints cho Order module
 *
 * ENDPOINTS:
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ Method │ Path                    │ Description           │ Access      │
 * ├────────┼─────────────────────────┼───────────────────────┼─────────────┤
 * │ POST   │ /api/orders             │ Tạo đơn (checkout)    │ User        │
 * │ GET    │ /api/orders             │ Danh sách đơn hàng    │ User/Admin  │
 * │ GET    │ /api/orders/:id         │ Chi tiết đơn hàng     │ Owner/Admin │
 * │ PUT    │ /api/orders/:id/status  │ Cập nhật trạng thái   │ Admin       │
 * │ PUT    │ /api/orders/:id/payment │ Cập nhật thanh toán   │ Admin       │
 * │ PUT    │ /api/orders/:id/cancel  │ Hủy đơn hàng          │ Owner/Admin │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * MIDDLEWARE CHAIN:
 * 1. authenticate - Xác thực JWT token
 * 2. validate - Validate request body bằng Zod schema
 * 3. authorize - Kiểm tra quyền (cho admin routes)
 * 4. controller - Xử lý business logic
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=order.routes.d.ts.map