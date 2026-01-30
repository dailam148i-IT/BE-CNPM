/**
 * =============================================================================
 * VALIDATE.TS - Middleware xác thực dữ liệu đầu vào
 * =============================================================================
 * 
 * Middleware này sử dụng Joi để validate request body
 * 
 * TẠI SAO CẦN VALIDATE?
 * - Bảo vệ server khỏi dữ liệu xấu
 * - Tránh lỗi runtime (undefined, null)
 * - Phản hồi lỗi rõ ràng cho client
 * - Tự động ép kiểu (string → number)
 * 
 * CÁCH DÙNG:
 *   import { validate } from '../middleware/validate';
 *   import { loginSchema } from './auth.validation';
 *   
 *   router.post('/login', validate(loginSchema), controller.login);
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler.js';

/**
 * VALIDATE MIDDLEWARE FACTORY
 * 
 * Tạo middleware validate dựa trên Joi schema
 * 
 * @param schema - Joi schema để validate
 * @returns Middleware function
 * 
 * Flow:
 * 1. Validate req.body với schema
 * 2. Nếu OK → gán giá trị đã được normalize vào req.body
 * 3. Nếu lỗi → throw ValidationError với message chi tiết
 * 
 * @example
 * const schema = Joi.object({
 *   email: Joi.string().email().required(),
 *   password: Joi.string().min(6).required(),
 * });
 * 
 * router.post('/login', validate(schema), (req, res) => {
 *   // req.body đã được validate, an toàn để sử dụng
 *   const { email, password } = req.body;
 * });
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    // Validate request body
    // Options:
    // - abortEarly: false → Thu thập TẤT CẢ lỗi, không dừng ở lỗi đầu tiên
    // - stripUnknown: true → Loại bỏ các field không có trong schema
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // Nếu có lỗi validation
    if (error) {
      // Lấy tất cả messages lỗi và join thành 1 string
      // error.details = [{ message: '...' }, { message: '...' }]
      const messages = error.details
        .map((detail) => detail.message)
        .join(', ');

      // Throw ValidationError → được bắt bởi error handler
      throw new ValidationError(messages);
    }

    // Gán giá trị đã validate & normalize vào req.body
    // Ví dụ: trim strings, convert types, etc.
    req.body = value;

    // Tiếp tục đến handler
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
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details
        .map((detail) => detail.message)
        .join(', ');

      throw new ValidationError(messages);
    }

    req.params = value;
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
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details
        .map((detail) => detail.message)
        .join(', ');

      throw new ValidationError(messages);
    }

    req.query = value;
    next();
  };
};

/**
 * =============================================================================
 * COMMON VALIDATION SCHEMAS
 * =============================================================================
 * 
 * Các schema dùng chung cho nhiều modules
 */

/**
 * Schema cho ID parameter
 * CUID format: c + 24 ký tự alphanumeric
 */
export const idParamSchema = Joi.object({
  id: Joi.string()
    .pattern(/^c[a-z0-9]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'ID không hợp lệ',
      'any.required': 'ID là bắt buộc',
    }),
});

/**
 * Schema cho pagination query
 * ?page=1&limit=10&sort=createdAt&order=desc
 */
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
});
