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
export declare class AppError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(message: string, statusCode?: number);
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
export declare class NotFoundError extends AppError {
    constructor(message?: string);
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
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
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
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
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
export declare class ValidationError extends AppError {
    constructor(message?: string);
}
/**
 * BadRequestError - Lỗi 400
 * Dùng khi request không hợp lệ (logic error, duplicate data, etc.)
 *
 * @example
 * if (existingSlug) {
 *   throw new BadRequestError('Slug đã tồn tại');
 * }
 */
export declare class BadRequestError extends AppError {
    constructor(message?: string);
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
export declare const errorHandler: (err: Error | AppError, req: Request, res: Response, _next: NextFunction) => void;
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
export declare const asyncHandler: (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map