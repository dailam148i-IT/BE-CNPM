/**
 * =============================================================================
 * AUTH.SCHEMA.TS - Validation Schemas cho Auth Module (Zod)
 * =============================================================================
 * 
 * File này định nghĩa các Zod schemas để validate input của các API auth
 * 
 * CHUYỂN TỪ JOI SANG ZOD:
 * - Joi.string().min(6)  → z.string().min(6)
 * - Joi.object({})       → z.object({})
 * - .required()          → (mặc định required, dùng .optional() nếu cần)
 * - .messages({})        → Custom message trong từng method
 * 
 * MỖI ENDPOINT CÓ 1 SCHEMA:
 * - registerSchema: Đăng ký tài khoản
 * - loginSchema: Đăng nhập
 * - refreshTokenSchema: Refresh access token
 * - changePasswordSchema: Đổi mật khẩu
 * 
 * CÁCH DÙNG:
 *   import { loginSchema } from './auth.schema';
 *   router.post('/login', validate(loginSchema), controller.login);
 */

import { z } from 'zod';

// =============================================================================
// REGISTER SCHEMA
// =============================================================================
/**
 * Validate dữ liệu đăng ký tài khoản mới
 * 
 * Fields:
 * - username: Bắt buộc, 3-50 ký tự, alphanumeric + underscore
 * - email: Bắt buộc, format email hợp lệ
 * - password: Bắt buộc, tối thiểu 6 ký tự
 * - fullName: Optional, tối đa 100 ký tự
 * - phone: Optional, 10-11 số
 */
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username phải có ít nhất 3 ký tự')
    .max(50, 'Username tối đa 50 ký tự')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username chỉ chứa chữ, số và dấu gạch dưới'),

  email: z
    .string()
    .email('Email không hợp lệ'),

  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu tối đa 100 ký tự'),

  fullName: z
    .string()
    .max(100, 'Họ tên tối đa 100 ký tự')
    .optional(),

  phone: z
    .string()
    .regex(/^[0-9]{10,11}$/, 'Số điện thoại phải là 10-11 chữ số')
    .optional()
    .or(z.literal('')), // Cho phép empty string
});

// =============================================================================
// LOGIN SCHEMA
// =============================================================================
/**
 * Validate dữ liệu đăng nhập
 * 
 * Fields:
 * - email: Bắt buộc, format email
 * - password: Bắt buộc
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email không hợp lệ'),

  password: z
    .string(),
});

// =============================================================================
// REFRESH TOKEN SCHEMA
// =============================================================================
/**
 * Validate request refresh token
 * 
 * Có 2 cách gửi refresh token:
 * 1. Trong body (cho mobile apps)
 * 2. Trong cookie (cho web - tự động gửi)
 * 
 * Schema này validate body, cookie được xử lý trong controller
 */
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(),
});

// =============================================================================
// CHANGE PASSWORD SCHEMA
// =============================================================================
/**
 * Validate dữ liệu đổi mật khẩu
 * 
 * Fields:
 * - currentPassword: Mật khẩu hiện tại
 * - newPassword: Mật khẩu mới (khác mật khẩu cũ)
 * - confirmPassword: Xác nhận mật khẩu mới (phải trùng newPassword)
 * 
 * .refine(): Custom validation logic
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string(),

    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
      .max(100, 'Mật khẩu mới tối đa 100 ký tự'),

    confirmPassword: z
      .string(),
  })
  // refine: Thêm custom validation
  // Check confirmPassword === newPassword
  .refine((data) => data.confirmPassword === data.newPassword, {
    message: 'Xác nhận mật khẩu không khớp',
    path: ['confirmPassword'], // Gán lỗi vào field confirmPassword
  });

// =============================================================================
// TYPE EXPORTS
// =============================================================================
/**
 * Export TypeScript types từ schemas
 * 
 * z.infer<typeof schema>: Tự động infer type từ schema
 * Không cần define interface riêng
 */
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
