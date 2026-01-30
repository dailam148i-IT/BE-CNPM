/**
 * =============================================================================
 * AUTHENTICATE.TS - Middleware xác thực JWT
 * =============================================================================
 * 
 * Middleware này kiểm tra xem user đã đăng nhập chưa bằng cách:
 * 1. Lấy token từ header Authorization
 * 2. Verify token bằng secret key
 * 3. Gắn thông tin user vào req.user
 * 
 * CÁCH DÙNG:
 *   // Protected route - chỉ user đã login mới access được
 *   router.get('/profile', authenticate, controller.getProfile);
 *   
 *   // Admin only route
 *   router.delete('/users/:id', authenticate, authorize('ADMIN'), controller.delete);
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from './errorHandler.js';

/**
 * Mở rộng Request type của Express
 * 
 * Thêm property 'user' vào Request để lưu thông tin user đã đăng nhập
 * 
 * declare global: Khai báo trong global scope
 * namespace Express: Mở rộng Express module
 * interface Request: Thêm properties vào Request
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
 * Dữ liệu được encode trong token
 */
interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;  // Issued at (thời gian tạo token)
  exp?: number;  // Expiration (thời gian hết hạn)
}

/**
 * AUTHENTICATE MIDDLEWARE
 * 
 * Kiểm tra và verify JWT access token
 * 
 * Flow:
 * 1. Lấy Authorization header
 * 2. Kiểm tra format "Bearer <token>"
 * 3. Verify token bằng secret
 * 4. Gắn payload vào req.user
 * 5. Gọi next() để tiếp tục
 * 
 * @throws UnauthorizedError nếu không có token hoặc token không hợp lệ
 */
export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    // 1. Lấy Authorization header
    // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    const authHeader = req.headers.authorization;

    // 2. Kiểm tra header có tồn tại và đúng format không
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token không được cung cấp');
    }

    // 3. Tách token ra khỏi "Bearer "
    // "Bearer abc123".split(' ') = ['Bearer', 'abc123']
    const token = authHeader.split(' ')[1];

    // 4. Verify token
    // jwt.verify sẽ:
    // - Kiểm tra signature (có bị thay đổi không)
    // - Kiểm tra expiration (còn hạn không)
    // - Decode payload
    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as JwtPayload;

    // 5. Gắn user info vào request
    // Các middleware/controller sau có thể truy cập qua req.user
    req.user = {
      userId: payload.userId,
      role: payload.role,
    };

    // 6. Tiếp tục đến middleware/handler tiếp theo
    next();
  } catch (error) {
    // Xử lý các loại lỗi JWT
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token đã hết hạn'));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Access token không hợp lệ'));
      return;
    }

    // Lỗi khác (đã throw UnauthorizedError ở trên)
    next(error);
  }
};

/**
 * AUTHORIZE MIDDLEWARE
 * 
 * Kiểm tra user có đúng role được phép không
 * PHẢI dùng SAU authenticate middleware
 * 
 * @param allowedRoles - Danh sách roles được phép
 * @returns Middleware function
 * 
 * @example
 * // Chỉ ADMIN
 * router.delete('/users/:id', authenticate, authorize('ADMIN'), ...)
 * 
 * // ADMIN hoặc STAFF
 * router.put('/orders/:id', authenticate, authorize('ADMIN', 'STAFF'), ...)
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Kiểm tra đã authenticate chưa
    if (!req.user) {
      next(new UnauthorizedError('Chưa đăng nhập'));
      return;
    }

    // Kiểm tra role có nằm trong danh sách được phép không
    if (!allowedRoles.includes(req.user.role)) {
      next(new ForbiddenError('Bạn không có quyền thực hiện hành động này'));
      return;
    }

    next();
  };
};

/**
 * OPTIONAL AUTHENTICATE
 * 
 * Giống authenticate nhưng KHÔNG throw error nếu không có token
 * Dùng cho các endpoint public nhưng cần biết user nếu đã login
 * 
 * @example
 * // Xem sản phẩm - ai cũng xem được, nhưng nếu login thì hiện thêm info
 * router.get('/products/:id', optionalAuth, controller.getProduct);
 */
export const optionalAuth = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Không có token → không sao, tiếp tục
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
    // Token không hợp lệ → bỏ qua, tiếp tục như guest
    next();
  }
};
