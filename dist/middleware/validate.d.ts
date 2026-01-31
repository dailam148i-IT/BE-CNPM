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
import { ZodSchema } from 'zod';
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
export declare const validate: (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * VALIDATE PARAMS
 *
 * Validate URL parameters (req.params)
 *
 * @example
 * // Validate :id phải là CUID
 * router.get('/users/:id', validateParams(idSchema), controller.getUser);
 */
export declare const validateParams: (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => void;
/**
 * VALIDATE QUERY
 *
 * Validate query parameters (req.query)
 *
 * @example
 * // Validate pagination
 * router.get('/products', validateQuery(paginationSchema), controller.list);
 */
export declare const validateQuery: (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => void;
import { z } from 'zod';
/**
 * Schema cho ID parameter
 * CUID format: c + 24 ký tự alphanumeric
 */
export declare const idParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Schema cho pagination query
 * ?page=1&limit=10&sort=createdAt&order=desc
 */
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodDefault<z.ZodString>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    order: "asc" | "desc";
    sort: string;
    page: number;
    limit: number;
}, {
    order?: "asc" | "desc" | undefined;
    sort?: string | undefined;
    page?: number | undefined;
    limit?: number | undefined;
}>;
//# sourceMappingURL=validate.d.ts.map