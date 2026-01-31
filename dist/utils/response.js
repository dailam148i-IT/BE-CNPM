/**
 * =============================================================================
 * RESPONSE.TS - Helper functions để trả response thống nhất
 * =============================================================================
 *
 * File này cung cấp các hàm helper để trả response API với format chuẩn.
 *
 * TẠI SAO CẦN FILE NÀY?
 * - Đảm bảo tất cả API trả về cùng format
 * - Tránh lặp code res.status().json() ở mọi nơi
 * - Dễ thay đổi format response sau này (chỉ sửa 1 chỗ)
 *
 * FORMAT RESPONSE:
 * {
 *   success: true/false,
 *   data?: T,           // Dữ liệu trả về (chỉ khi success)
 *   message?: string,   // Thông báo lỗi (chỉ khi error)
 *   meta?: {...}        // Pagination info (optional)
 * }
 */
/**
 * Trả response thành công
 *
 * @param res - Express Response object
 * @param data - Dữ liệu trả về (generic type T)
 * @param statusCode - HTTP status code (mặc định 200)
 * @param meta - Thông tin pagination (optional)
 *
 * @example
 * // Trả về user
 * success(res, { id: 1, name: 'John' });
 *
 * // Trả về với status 201 (Created)
 * success(res, newUser, 201);
 *
 * // Trả về với pagination
 * success(res, users, 200, { page: 1, total: 100 });
 */
export const success = (res, data, statusCode = 200, meta) => {
    return res.status(statusCode).json({
        success: true,
        data,
        // Spread operator với điều kiện: chỉ thêm meta nếu có
        ...(meta && { meta }),
    });
};
/**
 * Trả response lỗi
 *
 * @param res - Express Response object
 * @param message - Thông báo lỗi
 * @param statusCode - HTTP status code (mặc định 400 - Bad Request)
 *
 * @example
 * error(res, 'Email đã tồn tại');
 * error(res, 'Lỗi server', 500);
 */
export const error = (res, message, statusCode = 400) => {
    return res.status(statusCode).json({
        success: false,
        message,
    });
};
/**
 * Trả response 404 Not Found
 *
 * @param res - Express Response object
 * @param message - Thông báo (mặc định 'Resource not found')
 *
 * @example
 * // User không tồn tại
 * if (!user) {
 *   return notFound(res, 'User không tồn tại');
 * }
 */
export const notFound = (res, message = 'Resource not found') => {
    return error(res, message, 404);
};
/**
 * Trả response 401 Unauthorized
 * Dùng khi user chưa đăng nhập hoặc token không hợp lệ
 *
 * @example
 * if (!req.user) {
 *   return unauthorized(res, 'Vui lòng đăng nhập');
 * }
 */
export const unauthorized = (res, message = 'Unauthorized') => {
    return error(res, message, 401);
};
/**
 * Trả response 403 Forbidden
 * Dùng khi user đã đăng nhập nhưng không có quyền
 *
 * @example
 * if (user.role !== 'ADMIN') {
 *   return forbidden(res, 'Chỉ admin mới có quyền');
 * }
 */
export const forbidden = (res, message = 'Access denied') => {
    return error(res, message, 403);
};
/**
 * Trả response 500 Internal Server Error
 * Dùng cho lỗi server không mong đợi
 *
 * @example
 * try {
 *   // code
 * } catch (err) {
 *   return serverError(res, 'Đã có lỗi xảy ra');
 * }
 */
export const serverError = (res, message = 'Internal server error') => {
    return error(res, message, 500);
};
//# sourceMappingURL=response.js.map