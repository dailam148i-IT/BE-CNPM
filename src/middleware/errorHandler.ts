/**
 * =============================================================================
 * ERRORHANDLER.TS - Xử lý lỗi tập trung
 * =============================================================================
 * 
 * File này cung cấp:
 * 1. Custom Error classes - Các class lỗi tùy chỉnh
 * 2. Error Handler Middleware - Middleware bắt và xử lý tất cả lỗi
 * 3. Async Handler - Wrapper để bắt lỗi trong async functions
 * 
 * TẠI SAO CẦN CUSTOM ERRORS?
 * - Phân loại lỗi rõ ràng (404, 401, 403, etc.)
 * - Throw error với message và status code cùng lúc
 * - Dễ xử lý trong error handler
 * 
 * CÁCH DÙNG:
 *   throw new NotFoundError('User không tồn tại');
 *   throw new UnauthorizedError('Token không hợp lệ');
 */

import { Request, Response, NextFunction } from 'express';

/**
 * =============================================================================
 * PHẦN 1: CUSTOM ERROR CLASSES
 * =============================================================================
 */

/**
 * AppError - Base Error class
 * 
 * Tất cả custom errors sẽ extends từ class này
 * 
 * @property statusCode - HTTP status code (400, 404, 401, etc.)
 * @property isOperational - true = lỗi dự kiến được, false = lỗi bất ngờ
 * 
 * Error.captureStackTrace: Ghi lại stack trace để debug
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 400) {
    // Gọi constructor của Error với message
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = true; // Đánh dấu là operational error

    // Ghi lại stack trace, loại bỏ constructor khỏi stack
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * NotFoundError - Lỗi 404
 * Dùng khi không tìm thấy resource (user, product, order, etc.)
 * 
 * @example
 * const user = await prisma.user.findUnique({ where: { id } });
 * if (!user) {
 *   throw new NotFoundError('User không tồn tại');
 * }
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * UnauthorizedError - Lỗi 401
 * Dùng khi:
 * - Chưa đăng nhập (không có token)
 * - Token không hợp lệ hoặc hết hạn
 * - Sai email/password
 * 
 * @example
 * if (!token) {
 *   throw new UnauthorizedError('Vui lòng đăng nhập');
 * }
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

/**
 * ForbiddenError - Lỗi 403
 * Dùng khi đã đăng nhập nhưng không có quyền truy cập
 * 
 * Khác với 401:
 * - 401: Chưa xác thực (chưa biết bạn là ai)
 * - 403: Đã xác thực nhưng không có quyền
 * 
 * @example
 * if (user.role !== 'ADMIN') {
 *   throw new ForbiddenError('Chỉ admin mới có quyền truy cập');
 * }
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

/**
 * ValidationError - Lỗi 422
 * Dùng khi dữ liệu đầu vào không hợp lệ
 * 
 * @example
 * if (!email.includes('@')) {
 *   throw new ValidationError('Email không hợp lệ');
 * }
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 422);
  }
}

/**
 * =============================================================================
 * PHẦN 2: ERROR HANDLER MIDDLEWARE
 * =============================================================================
 * 
 * Middleware đặc biệt của Express với 4 parameters (err, req, res, next)
 * Express tự động gọi middleware này khi có error
 * 
 * LƯU Ý: Phải đặt CUỐI CÙNG trong middleware chain
 */

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction  // Prefix _ để TypeScript biết không dùng
): void => {
  // 1. Log lỗi để debug
  console.error('Error:', {
    message: err.message,
    // Chỉ show stack trace trong development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // 2. Xử lý Custom Error (AppError và subclasses)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // 3. Xử lý lỗi Prisma
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      success: false,
      message: 'Database error',
    });
    return;
  }

  // 4. Xử lý lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  // 5. Lỗi không xác định → trả 500
  // Production: ẩn chi tiết lỗi
  // Development: show message để debug
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
};

/**
 * =============================================================================
 * PHẦN 3: ASYNC HANDLER
 * =============================================================================
 * 
 * Wrapper function để tự động catch errors trong async functions
 * 
 * VẤN ĐỀ:
 * Express không tự catch errors trong async functions
 * Phải try-catch thủ công trong mỗi handler
 * 
 * GIẢI PHÁP:
 * Wrap handler trong asyncHandler, tự động catch và gọi next(error)
 * 
 * TRƯỚC:
 * router.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await getUsers();
 *     res.json(users);
 *   } catch (err) {
 *     next(err);
 *   }
 * });
 * 
 * SAU:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json(users);
 * }));
 */
export const asyncHandler = (
  // fn: async function nhận req, res, next và return Promise
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) => {
  // Trả về function mới wrap fn trong Promise
  return (req: Request, res: Response, next: NextFunction): void => {
    // Promise.resolve: đảm bảo fn() là Promise
    // .catch(next): nếu có error → gọi next(error) → error handler
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
