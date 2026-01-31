/**
 * =============================================================================
 * VALIDATE.TS - Middleware xác thực dữ liệu đầu vào (Zod)
 * =============================================================================
 * 
 * Middleware này sử dụng Zod để validate request body/params/query
 * 
 * TẠI SAO DÙNG ZOD?
 * - Nhẹ hơn Joi (~50KB vs ~150KB)
 * - Native TypeScript (tự động infer types)
 * - Dùng được cả Frontend và Backend
 * - API đơn giản hơn
 * 
 * CÁCH DÙNG:
 *   import { validate } from '../middleware/validate';
 *   import { loginSchema } from './auth.schema';
 *   
 *   router.post('/login', validate(loginSchema), controller.login);
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from './errorHandler.js';

/**
 * VALIDATE MIDDLEWARE FACTORY
 * 
 * Tạo middleware validate dựa trên Zod schema
 * 
 * @param schema - Zod schema để validate
 * @returns Middleware function
 * 
 * Flow:
 * 1. safeParse req.body với schema
 * 2. Nếu OK → gán giá trị đã được parse vào req.body
 * 3. Nếu lỗi → throw ValidationError với message chi tiết
 * 
 * @example
 * const schema = z.object({
 *   email: z.string().email('Email không hợp lệ'),
 *   password: z.string().min(6, 'Tối thiểu 6 ký tự'),
 * });
 * 
 * router.post('/login', validate(schema), (req, res) => {
 *   // req.body đã được validate, an toàn để sử dụng
 *   const { email, password } = req.body;
 * });
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // safeParse: Không throw error, trả về { success, data, error }
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // Format Zod errors thành message string
      const messages = formatZodError(result.error);
      throw new ValidationError(messages);
    }

    // Gán giá trị đã validate & transform vào req.body
    req.body = result.data;
    next();
  };
};

/**
 * VALIDATE PARAMS
 * 
 * Validate URL parameters (req.params)
 * 
 * @example
 * // Validate :id phải là CUID
 * router.get('/users/:id', validateParams(idSchema), controller.getUser);
 */
export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const messages = formatZodError(result.error);
      throw new ValidationError(messages);
    }

    // Use type assertion since Zod parsed data matches expected structure
    (req.params as Record<string, string>) = result.data as Record<string, string>;
    next();
  };
};

/**
 * VALIDATE QUERY
 * 
 * Validate query parameters (req.query)
 * 
 * @example
 * // Validate pagination
 * router.get('/products', validateQuery(paginationSchema), controller.list);
 */
export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const messages = formatZodError(result.error);
      throw new ValidationError(messages);
    }

    // Use type assertion since Zod parsed data matches expected structure
    Object.assign(req.query, result.data);
    next();
  };
};

/**
 * FORMAT ZOD ERROR
 * 
 * Chuyển ZodError thành string message dễ đọc
 * 
 * @param error - ZodError object
 * @returns String message
 * 
 * VÍ DỤ:
 *   Input: { issues: [{ path: ['email'], message: 'Invalid email' }] }
 *   Output: "email: Invalid email"
 */
function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join(', ');
}

// ============================================================================
// COMMON VALIDATION SCHEMAS
// ============================================================================
import { z } from 'zod';

/**
 * Schema cho ID parameter
 * CUID format: c + 24 ký tự alphanumeric
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^c[a-z0-9]{24}$/, 'ID không hợp lệ'),
});

/**
 * Schema cho pagination query
 * ?page=1&limit=10&sort=createdAt&order=desc
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});
