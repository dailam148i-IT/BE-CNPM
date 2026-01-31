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
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

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
        userId: string;    // ID của user trong database
        role: string;      // Role: ADMIN, STAFF, CUSTOMER
      };
    }
  }
}

/**
 * JWT Payload type
 * Cấu trúc dữ liệu nằm bên trong Token sau khi giải mã
 */
interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;  // Issued at (Thời điểm tạo token - Unix timestamp)
  exp?: number;  // Expiration (Thời điểm hết hạn - Unix timestamp)
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
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Lấy Authorization header từ request
    // Format chuẩn: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;

    // 2. Kiểm tra header có tồn tại và đúng format "Bearer ..." không
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token không được cung cấp');
    }

    // 3. Tách lấy chuỗi token (bỏ chữ "Bearer " ở đầu)
    // "Bearer abc123xyz".split(' ') -> ['Bearer', 'abc123xyz'] -> lấy phần tử [1]
    const token = authHeader.split(' ')[1];

    // 4. Verify token bằng Secret Key
    // jwt.verify() sẽ tự động kiểm tra:
    // - Tính toàn vẹn: Token có bị sửa đổi không? (dựa vào signature)
    // - Thời hạn: Token còn hạn không? (dựa vào exp)
    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET! // Dấu ! để bảo TS là biến này chắc chắn có
    ) as JwtPayload;

    // 5. Gắn thông tin User vào Request object
    // Để các middleware/controller phía sau biết user này là ai
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    // 6. Cho phép đi tiếp sang middleware/controller tiếp theo
    next();
  } catch (error) {
    // Xử lý các loại lỗi cụ thể của JWT lib để trả về thông báo rõ ràng hơn
    
    if (error instanceof jwt.TokenExpiredError) {
      // Lỗi hết hạn token (thường gặp nhất) -> FE sẽ catch 401 để gọi refresh token
      next(new UnauthorizedError('Access token đã hết hạn'));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      // Lỗi token sai format, sai chữ ký, bị sửa đổi...
      next(new UnauthorizedError('Access token không hợp lệ'));
      return;
    }

    // Các lỗi khác -> Throw tiếp cho Global Error Handler xử lý
    next(error);
  }
};

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
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Safety check: Đảm bảo authenticate đã chạy trước
    if (!req.user) {
      next(new UnauthorizedError('Chưa đăng nhập (Thiếu authentication middleware)'));
      return;
    }

    // Kiểm tra Role của user có nằm trong danh sách được phép không
    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Bạn không có quyền thực hiện hành động này'));
      return;
    }

    // Cấp quyền thành công -> đi tiếp
    next();
  };
};

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
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    // Không có header -> Coi như khách vãng lai, cho qua
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as JwtPayload;

    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    next();
  } catch {
    // Token lỗi (hết hạn/sai) -> Coi như chưa login, KHÔNG throw error
    // Chỉ đơn giản là req.user sẽ là undefined
    next();
  }
};
