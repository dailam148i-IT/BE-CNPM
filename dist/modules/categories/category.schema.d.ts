/**
 * =============================================================================
 * CATEGORY.SCHEMA.TS - Validation Schemas cho Category Module
 * =============================================================================
 *
 * File này định nghĩa các validation schemas sử dụng Zod
 *
 * ZOD LÀ GÌ?
 * - Library validation cho TypeScript
 * - Tự động infer types từ schema
 * - Dùng được cả Frontend và Backend
 *
 * TẠI SAO DÙNG ZOD THAY VÌ JOI?
 * - Nhẹ hơn (~50KB vs ~150KB)
 * - Native TypeScript (không cần @types)
 * - Share schema giữa FE/BE dễ dàng
 *
 * CÁCH DÙNG:
 *   const result = createCategorySchema.safeParse(req.body);
 *   if (!result.success) {
 *     // Handle validation errors
 *   }
 */
import { z } from 'zod';
/**
 * Schema cho POST /api/categories
 *
 * REQUIRED:
 * - name: Tên category (2-255 ký tự)
 *
 * OPTIONAL:
 * - description: Mô tả (max 500)
 * - parentId: ID category cha
 * - type: Loại category
 * - isActive: Trạng thái
 */
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodDefault<z.ZodEnum<["PRODUCT", "NEWS", "PAGE"]>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type: "PRODUCT" | "NEWS" | "PAGE";
    name: string;
    isActive: boolean;
    description?: string | undefined;
    parentId?: string | null | undefined;
}, {
    name: string;
    type?: "PRODUCT" | "NEWS" | "PAGE" | undefined;
    description?: string | undefined;
    parentId?: string | null | undefined;
    isActive?: boolean | undefined;
}>;
/**
 * Schema cho PUT /api/categories/:id
 *
 * Tất cả fields đều optional (partial update)
 * Chỉ validate các fields được truyền
 */
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<["PRODUCT", "NEWS", "PAGE"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "PRODUCT" | "NEWS" | "PAGE" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    parentId?: string | null | undefined;
    isActive?: boolean | undefined;
}, {
    type?: "PRODUCT" | "NEWS" | "PAGE" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    parentId?: string | null | undefined;
    isActive?: boolean | undefined;
}>;
/**
 * Schema cho query parameters
 *
 * z.coerce.boolean(): Tự động chuyển "true"/"false" string → boolean
 * Vì query params luôn là string
 */
export declare const categoryQuerySchema: z.ZodObject<{
    type: z.ZodOptional<z.ZodEnum<["PRODUCT", "NEWS", "PAGE"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    includeChildren: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    type?: "PRODUCT" | "NEWS" | "PAGE" | undefined;
    isActive?: boolean | undefined;
    includeChildren?: boolean | undefined;
}, {
    type?: "PRODUCT" | "NEWS" | "PAGE" | undefined;
    isActive?: boolean | undefined;
    includeChildren?: boolean | undefined;
}>;
/**
 * Export TypeScript types từ schemas
 *
 * z.infer<typeof schema>: Tự động tạo type từ schema
 * Không cần define type riêng, giảm duplicate code
 *
 * VÍ DỤ:
 *   type CreateCategoryDto = {
 *     name: string;
 *     description?: string;
 *     parentId?: string;
 *     type: "PRODUCT" | "NEWS" | "PAGE";
 *     isActive: boolean;
 *   }
 */
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type CategoryQueryDto = z.infer<typeof categoryQuerySchema>;
//# sourceMappingURL=category.schema.d.ts.map