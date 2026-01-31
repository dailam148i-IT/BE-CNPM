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
import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { registerSchema, loginSchema, refreshTokenSchema, changePasswordSchema, } from './auth.schema.js';
// Tạo Router instance
const router = Router();
/**
 * =============================================================================
 * PUBLIC ROUTES
 * =============================================================================
 *
 * Không cần đăng nhập để truy cập
 */
/**
 * POST /api/auth/register
 *
 * Đăng ký tài khoản mới
 *
 * Middleware chain:
 * 1. validate(registerSchema) - Validate body
 * 2. authController.register - Xử lý đăng ký
 */
router.post('/register', validate(registerSchema), authController.register);
/**
 * POST /api/auth/login
 *
 * Đăng nhập
 *
 * Middleware chain:
 * 1. validate(loginSchema) - Validate body
 * 2. authController.login - Xử lý đăng nhập
 */
router.post('/login', validate(loginSchema), authController.login);
/**
 * POST /api/auth/refresh
 *
 * Refresh access token
 * Refresh token được gửi qua cookie hoặc body
 */
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
/**
 * =============================================================================
 * PROTECTED ROUTES
 * =============================================================================
 *
 * Yêu cầu đăng nhập (có access token hợp lệ)
 */
/**
 * POST /api/auth/logout
 *
 * Đăng xuất
 *
 * Middleware chain:
 * 1. authenticate - Kiểm tra JWT
 * 2. authController.logout - Xử lý đăng xuất
 */
router.post('/logout', authenticate, authController.logout);
/**
 * GET /api/auth/me
 *
 * Lấy thông tin user đang đăng nhập
 */
router.get('/me', authenticate, authController.getProfile);
/**
 * PUT /api/auth/password
 *
 * Đổi mật khẩu
 */
router.put('/password', authenticate, validate(changePasswordSchema), authController.changePassword);
// Export router để dùng trong server.ts
export default router;
//# sourceMappingURL=auth.routes.js.map