/**
 * =============================================================================
 * AUTH.VALIDATION.TS - Schemas xác thực dữ liệu cho Auth Module
 * =============================================================================
 * 
 * File này định nghĩa các Joi schemas để validate input của các API auth
 * 
 * MỖI ENDPOINT CÓ 1 SCHEMA:
 * - registerSchema: Đăng ký tài khoản
 * - loginSchema: Đăng nhập
 * - refreshTokenSchema: Refresh access token
 * - changePasswordSchema: Đổi mật khẩu
 * 
 * CÁCH DÙNG:
 *   import { loginSchema } from './auth.validation';
 *   router.post('/login', validate(loginSchema), controller.login);
 */

import Joi from 'joi';

/**
 * =============================================================================
 * REGISTER SCHEMA
 * =============================================================================
 * 
 * Validate dữ liệu đăng ký tài khoản mới
 * 
 * Fields:
 * - username: Bắt buộc, 3-50 ký tự, alphanumeric + underscore
 * - email: Bắt buộc, format email hợp lệ
 * - password: Bắt buộc, tối thiểu 6 ký tự
 * - fullName: Optional, tối đa 100 ký tự
 * - phone: Optional, 10-11 số
 */
export const registerSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .pattern(/^[a-zA-Z0-9_]+$/)
    .required()
    .messages({
      'string.min': 'Username phải có ít nhất 3 ký tự',
      'string.max': 'Username tối đa 50 ký tự',
      'string.pattern.base': 'Username chỉ chứa chữ, số và dấu gạch dưới',
      'any.required': 'Username là bắt buộc',
    }),

  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc',
    }),

  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu tối đa 100 ký tự',
      'any.required': 'Mật khẩu là bắt buộc',
    }),

  fullName: Joi.string()
    .max(100)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Họ tên tối đa 100 ký tự',
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Số điện thoại phải là 10-11 chữ số',
    }),
});

/**
 * =============================================================================
 * LOGIN SCHEMA
 * =============================================================================
 * 
 * Validate dữ liệu đăng nhập
 * 
 * Fields:
 * - email: Bắt buộc, format email
 * - password: Bắt buộc
 */
export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'any.required': 'Email là bắt buộc',
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Mật khẩu là bắt buộc',
    }),
});

/**
 * =============================================================================
 * REFRESH TOKEN SCHEMA
 * =============================================================================
 * 
 * Validate request refresh token
 * 
 * Có 2 cách gửi refresh token:
 * 1. Trong body (cho mobile apps)
 * 2. Trong cookie (cho web - tự động gửi)
 * 
 * Schema này validate body, cookie được xử lý trong controller
 */
export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .optional()
    .messages({
      'string.empty': 'Refresh token không được để trống',
    }),
});

/**
 * =============================================================================
 * CHANGE PASSWORD SCHEMA
 * =============================================================================
 * 
 * Validate dữ liệu đổi mật khẩu
 * 
 * Fields:
 * - currentPassword: Mật khẩu hiện tại
 * - newPassword: Mật khẩu mới (khác mật khẩu cũ)
 * - confirmPassword: Xác nhận mật khẩu mới (phải trùng newPassword)
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Mật khẩu hiện tại là bắt buộc',
    }),

  newPassword: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'any.required': 'Mật khẩu mới là bắt buộc',
    }),

  // ref('newPassword'): Tham chiếu đến field newPassword
  // valid(Joi.ref(...)): Giá trị phải bằng giá trị của field được ref
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp',
      'any.required': 'Xác nhận mật khẩu là bắt buộc',
    }),
});

/**
 * Type definitions cho TypeScript
 * Infer type từ Joi schema để có type safety
 */
export type RegisterDto = {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
};

export type LoginDto = {
  email: string;
  password: string;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
