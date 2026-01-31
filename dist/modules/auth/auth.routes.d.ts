/**
 * =============================================================================
 * AUTH.ROUTES.TS - Định nghĩa Routes cho Authentication
 * =============================================================================
 *
 * File này định nghĩa tất cả endpoints của Auth module
 *
 * ENDPOINTS:
 * POST   /api/auth/register   - Đăng ký tài khoản
 * POST   /api/auth/login      - Đăng nhập
 * POST   /api/auth/refresh    - Refresh access token
 * POST   /api/auth/logout     - Đăng xuất (protected)
 * GET    /api/auth/me         - Lấy profile (protected)
 * PUT    /api/auth/password   - Đổi mật khẩu (protected)
 *
 * ROUTE STRUCTURE:
 * router.[method](path, [middlewares...], handler)
 *
 * Ví dụ:
 * router.post('/login', validate(loginSchema), authController.login)
 *        ↓         ↓              ↓                    ↓
 *     method     path      middleware 1            handler
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=auth.routes.d.ts.map