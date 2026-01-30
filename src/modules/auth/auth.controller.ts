/**
 * =============================================================================
 * AUTH.CONTROLLER.TS - Xử lý Request/Response cho Auth
 * =============================================================================
 * 
 * Controller là cầu nối giữa Routes và Service
 * 
 * NHIỆM VỤ:
 * - Nhận request từ client
 * - Extract dữ liệu từ req.body, req.params, req.cookies
 * - Gọi Service xử lý logic
 * - Trả response về client
 * - Set cookies (refresh token)
 * 
 * KHÔNG LÀM:
 * - Business logic (đó là việc của Service)
 * - Truy vấn database trực tiếp
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { success } from '../../utils/response.js';

/**
 * Cookie options cho Refresh Token
 * 
 * - httpOnly: JavaScript không thể access (chống XSS)
 * - secure: Chỉ gửi qua HTTPS (production)
 * - sameSite: Chống CSRF attacks
 * - maxAge: Thời gian sống của cookie (ms)
 */
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  path: '/', // Cookie available cho toàn bộ domain
};

/**
 * AUTH CONTROLLER OBJECT
 * 
 * Mỗi method tương ứng với 1 endpoint
 */
export const authController = {
  /**
   * ===========================================================================
   * REGISTER - POST /api/auth/register
   * ===========================================================================
   * 
   * Đăng ký tài khoản mới
   * 
   * Request body:
   * {
   *   "username": "john_doe",
   *   "email": "john@example.com",
   *   "password": "123456",
   *   "fullName": "John Doe",
   *   "phone": "0901234567"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": { "id": "...", "username": "...", ... }
   * }
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      // Gọi service xử lý (req.body đã được validate bởi middleware)
      const user = await authService.register(req.body);

      // Trả về với status 201 (Created)
      success(res, user, 201);
    } catch (error) {
      // Chuyển lỗi cho error handler
      next(error);
    }
  },

  /**
   * ===========================================================================
   * LOGIN - POST /api/auth/login
   * ===========================================================================
   * 
   * Đăng nhập
   * 
   * Request body:
   * {
   *   "email": "john@example.com",
   *   "password": "123456"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "user": { ... },
   *     "accessToken": "eyJ..."
   *   }
   * }
   * 
   * + Set-Cookie: refreshToken (httpOnly)
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      // Set refresh token vào cookie
      // Client không cần xử lý, browser tự gửi trong mỗi request
      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      // Trả về user và access token
      // KHÔNG trả refresh token trong body (đã có trong cookie)
      success(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * ===========================================================================
   * REFRESH TOKEN - POST /api/auth/refresh
   * ===========================================================================
   * 
   * Tạo mới Access Token khi token cũ hết hạn
   * 
   * Refresh token được lấy từ:
   * 1. Cookie (web browser) - tự động
   * 2. Request body (mobile app) - manual
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": { "accessToken": "eyJ..." }
   * }
   * 
   * + Set-Cookie: refreshToken mới (token rotation)
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Lấy refresh token từ cookie hoặc body
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new Error('Refresh token không được cung cấp');
      }

      const result = await authService.refreshToken(refreshToken);

      // Set refresh token mới (Token Rotation)
      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      // Trả về access token mới
      success(res, {
        accessToken: result.accessToken,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * ===========================================================================
   * LOGOUT - POST /api/auth/logout
   * ===========================================================================
   * 
   * Đăng xuất - Revoke refresh token
   * 
   * Yêu cầu: Phải đăng nhập (có access token)
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": { "message": "Đăng xuất thành công" }
   * }
   * 
   * + Clear cookie refreshToken
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      // req.user được gắn bởi authenticate middleware
      await authService.logout(refreshToken, req.user!.userId);

      // Xóa cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      success(res, { message: 'Đăng xuất thành công' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * ===========================================================================
   * GET PROFILE - GET /api/auth/me
   * ===========================================================================
   * 
   * Lấy thông tin người dùng hiện tại
   * 
   * Yêu cầu: Đã đăng nhập
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": { "id": "...", "username": "...", "email": "...", ... }
   * }
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      success(res, user);
    } catch (error) {
      next(error);
    }
  },

  /**
   * ===========================================================================
   * CHANGE PASSWORD - PUT /api/auth/password
   * ===========================================================================
   * 
   * Đổi mật khẩu
   * 
   * Request body:
   * {
   *   "currentPassword": "old123",
   *   "newPassword": "new456",
   *   "confirmPassword": "new456"
   * }
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": { "message": "Đổi mật khẩu thành công" }
   * }
   * 
   * + Clear cookie (bắt đăng nhập lại)
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.userId, req.body);

      // Xóa cookie refresh token (bắt đăng nhập lại)
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
      });

      success(res, { message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.' });
    } catch (error) {
      next(error);
    }
  },
};
