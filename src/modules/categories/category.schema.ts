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

// ============================================================================
// CREATE CATEGORY SCHEMA
// ============================================================================
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
export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, 'Tên danh mục phải có ít nhất 2 ký tự')
    .max(255, 'Tên danh mục tối đa 255 ký tự'),
  description: z.string().max(500).optional(),
  parentId: z.string().optional().nullable(), // CHO PHÉP NULL (danh mục gốc)
  type: z.enum(['PRODUCT', 'NEWS', 'PAGE']).default('PRODUCT'),
  isActive: z.boolean().default(true),
});

// ============================================================================
// UPDATE CATEGORY SCHEMA
// ============================================================================
/**
 * Schema cho PUT /api/categories/:id
 * 
 * Tất cả fields đều optional (partial update)
 * Chỉ validate các fields được truyền
 */
export const updateCategorySchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(500).optional().nullable(), // nullable = cho phép null
  parentId: z.string().optional().nullable(),
  type: z.enum(['PRODUCT', 'NEWS', 'PAGE']).optional(),
  isActive: z.boolean().optional(),
});

// ============================================================================
// QUERY PARAMS SCHEMA
// ============================================================================
/**
 * Schema cho query parameters
 * 
 * z.coerce.boolean(): Tự động chuyển "true"/"false" string → boolean
 * Vì query params luôn là string
 */
export const categoryQuerySchema = z.object({
  type: z.enum(['PRODUCT', 'NEWS', 'PAGE']).optional(),
  isActive: z.coerce.boolean().optional(),
  includeChildren: z.coerce.boolean().optional(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================
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
