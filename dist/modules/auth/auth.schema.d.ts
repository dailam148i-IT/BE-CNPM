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
export declare const registerSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
    fullName?: string | undefined;
    phone?: string | undefined;
}, {
    username: string;
    email: string;
    password: string;
    fullName?: string | undefined;
    phone?: string | undefined;
}>;
/**
 * Validate dữ liệu đăng nhập
 *
 * Fields:
 * - email: Bắt buộc, format email
 * - password: Bắt buộc
 */
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
/**
 * Validate request refresh token
 *
 * Có 2 cách gửi refresh token:
 * 1. Trong body (cho mobile apps)
 * 2. Trong cookie (cho web - tự động gửi)
 *
 * Schema này validate body, cookie được xử lý trong controller
 */
export declare const refreshTokenSchema: z.ZodObject<{
    refreshToken: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    refreshToken?: string | undefined;
}, {
    refreshToken?: string | undefined;
}>;
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
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>;
/**
 * Export TypeScript types từ schemas
 *
 * z.infer<typeof schema>: Tự động infer type từ schema
 * Không cần define interface riêng
 */
export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
//# sourceMappingURL=auth.schema.d.ts.map