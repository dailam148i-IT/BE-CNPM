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
export declare const authController: {
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
    register(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    login(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    refresh(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * ===========================================================================
     * LOGOUT - POST /api/auth/logout
     * ===========================================================================
     *
     * 1. Revoke token trong DB (Logic server)
     * 2. Xóa Cookie ở Client (Logic browser)
     */
    logout(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * ===========================================================================
     * GET PROFILE - GET /api/auth/me
     * ===========================================================================
     */
    getProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * ===========================================================================
     * CHANGE PASSWORD - PUT /api/auth/password
     * ===========================================================================
     */
    changePassword(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=auth.controller.d.ts.map