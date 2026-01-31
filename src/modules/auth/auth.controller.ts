/**
 * =============================================================================
 * AUTH.CONTROLLER.TS - Xử lý Request/Response cho Auth
 * =============================================================================
 * 
 * Controller là cầu nối giữa Routes và Service.
 * 
 * 🏗️ MVC DATA FLOW:
 *    Request  ---> [Routes] ---> [Controller] ---> [Service] ---> [Database]
 *                                     |
 *    Response <-----------------------|
 * 
 * NHIỆM VỤ:
 * 1. Nhận request từ client (req)
 * 2. Validate/Extract dữ liệu (body, params, cookies)
 * 3. Gọi Service xử lý logic (authService)
 * 4. Trả response về client (res)
 * 5. Quản lý HTTP Cookies (Refresh Token)
 */

import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { success } from '../../utils/response.js';

/**
 * Cookie options cho Refresh Token
 * 
 * - httpOnly: TRUE -> JavaScript client KHÔNG đọc được (chống XSS)
 * - secure: TRUE (Prod) -> Chỉ gửi qua HTTPS
 * - sameSite: 'strict' -> Chỉ gửi khi request từ cùng domain (chống CSRF)
 */
const REFRESH_TOKEN_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  path: '/',
};

export const authController = {
  /**
   * ===========================================================================
   * REGISTER - POST /api/auth/register
   * ===========================================================================
   * 
   * 🔄 FLOW:
   * 1. Client gửi JSON user info
   * 2. Middleware validate input (Joi/Zod)
   * 3. Controller gọi AuthService.register
   * 4. AuthService tạo user trong DB
   * 5. Trả về thông tin user (đã ẩn password)
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      success(res, user, 201); // 201 Created
    } catch (error) {
      next(error);
    }
  },

  /**
   * ===========================================================================
   * LOGIN - POST /api/auth/login
   * ===========================================================================
   * 
   * 🔄 FLOW:
   * 1. Client gửi Email + Password
   * 2. AuthService kiểm tra & tạo 2 tokens:
   *    - Access Token (ngắn hạn, 15p)
   *    - Refresh Token (dài hạn, 7 ngày)
   * 3. Controller:
   *    - Trả Access Token trong JSON response
   *    - Set Refresh Token vào HTTP-Only Cookie (An toàn hơn lưu LocalStorage)
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      // Set refresh token vào cookie an toàn
      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

      // Chỉ trả về Access Token cho client dùng ngay
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
   * 🔄 FLOW (Token Rotation):
   * 1. Access Token hết hạn -> Client gọi API Refresh
   * 2. Browser tự gửi Cookie chứa Refresh Token cũ
   * 3. Server verify & hủy Refresh Token cũ
   * 4. Server cấp cặp Token MỚI
   * 5. Client nhận Access Token mới & Browser cập nhật Cookie mới
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      // Ưu tiên lấy từ Cookie (An toàn), fallback sang Body (Mobile App)
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new Error('Refresh token không được cung cấp');
      }

      const result = await authService.refreshToken(refreshToken);

      // Token Rotation: Cập nhật cookie với token mới
      res.cookie('refreshToken', result.refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);

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
   * 1. Revoke token trong DB (Logic server)
   * 2. Xóa Cookie ở Client (Logic browser)
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      // Revoke trong DB để token không thể dùng lại dù chưa hết hạn
      await authService.logout(refreshToken, req.user!.userId);

      // Xóa Cookie phía Client
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
   */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      // req.user có được nhờ middleware `authenticate`
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
   */
  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      await authService.changePassword(req.user!.userId, req.body);

      // Đổi pass xong bắt đăng nhập lại -> Xóa cookie
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
