/**
 * =============================================================================
 * AUTHENTICATE.TS - Middleware xác thực JWT
 * =============================================================================
 *
 * Middleware này đóng vai trò "Bảo vệ" các API endpoints.
 * Nó đảm bảo chỉ những user đã đăng nhập (có token hợp lệ) mới được đi tiếp.
 *
 * 🔄 FLOW HOẠT ĐỘNG:
 *    [CLIENT]                  [SERVER - Middleware]                   [CONTROLLER]
 *       |                               |                                   |
 *       |-- Request + Token ----------> |                                   |
 *       |                               | 1. Kiểm tra Header Authorization  |
 *       |                               |    (Có "Bearer <token>" ko?)      |
 *       |                               |                                   |
 *       |                               | 2. Verify Token (JWT)             |
 *       |                               |    (Chữ ký đúng? Có hết hạn ko?)  |
 *       |                               |                                   |
 *       |      [Token Lỗi/Thiếu]        | 3. Nếu OK: Gắn user vào req       |
 *       |<------- Trả về 401 -----------|    (req.user = payload)           |
 *       |                               |                                   |
 *       |                               | 4. Next() ----------------------> | Xử lý logic
 *
 * CÁCH DÙNG:
 *   // Protected route - chỉ user đã login mới access được
 *   router.get('/profile', authenticate, controller.getProfile);
 *
 *   // Admin only route (kết hợp với authorize)
 *   router.delete('/users/:id', authenticate, authorize('ADMIN'), controller.delete);
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Mở rộng Request type của Express
 *
 * TypeScript mặc định không biết `req.user` là gì.
 * Ta cần "merge" thêm definition vào interface Request của Express.
 *
 * declare global: Khai báo trong global scope (toàn dự án nhìn thấy)
 * namespace Express: Mở rộng Express module
 * interface Request: Thêm properties options vào Request
 */
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string;
            };
        }
    }
}
/**
 * AUTHENTICATE MIDDLEWARE
 *
 * Nhiệm vụ:
 * - Chặn request không có token hoặc token rởm
 * - Cho phép request hợp lệ đi qua và đính kèm thông tin "Ai vửa gọi?"
 *
 * @throws UnauthorizedError (401) nếu xác thực thất bại
 */
export declare const authenticate: (req: Request, _res: Response, next: NextFunction) => void;
/**
 * AUTHORIZE MIDDLEWARE
 *
 * Nhiệm vụ: Phân quyền (Authorization)
 * Sau khi biết "Ai đang gọi" (Authentication), kiểm tra xem người đó "Có được phép làm không?"
 *
 * ⚠️ QUAN TRỌNG: Phải đặt SAU middleware `authenticate`
 * vì nó cần `req.user` (được tạo ra bởi `authenticate`)
 *
 * @param allowedRoles - Danh sách các role được phép (VD: 'ADMIN', 'STAFF')
 *
 * @example
 * // Chỉ ADMIN mới được xóa user
 * router.delete('/users/:id', authenticate, authorize('ADMIN'), userController.delete);
 */
export declare const authorize: (...allowedRoles: string[]) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * OPTIONAL AUTHENTICATE
 *
 * Phiên bản "dễ tính" của authenticate.
 * - Có token hợp lệ -> Gắn user info vào req
 * - Không có token hoặc token lỗi -> KHÔNG báo lỗi, cứ cho đi tiếp (req.user = undefined)
 *
 * Dùng cho: Các trang Public nhưng có nội dung cá nhân hóa (VD: Trang chủ, Chi tiết sản phẩm)
 * - Khách vãng lai: Xem giá thường
 * - User VIP: Xem giá khuyến mãi (nếu logic yêu cầu)
 */
export declare const optionalAuth: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=authenticate.d.ts.map