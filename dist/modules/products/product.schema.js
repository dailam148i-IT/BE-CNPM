/**
 * =============================================================================
 * PRODUCT.SCHEMA.TS - Validation Schemas cho Product Module
 * =============================================================================
 *
 * File này định nghĩa validation schemas sử dụng Zod
 *
 * VALIDATION LAYERS:
 * 1. Schema level: Zod validate structure, types
 * 2. Database level: Prisma validate constraints
 * 3. Business level: Service validate logic
 *
 * ZOD METHODS THƯỜNG DÙNG:
 * - z.string()    : Validate string
 * - z.number()    : Validate number
 * - z.enum([])    : Validate giá trị trong danh sách
 * - z.coerce.xxx(): Tự động convert type (string → number)
 * - .optional()   : Cho phép undefined
 * - .nullable()   : Cho phép null
 * - .default(val) : Giá trị mặc định
 * - .refine()     : Custom validation
 */
import { z } from 'zod';
// ============================================================================
// CREATE PRODUCT SCHEMA
// ============================================================================
/**
 * Schema cho POST /api/products
 *
 * REQUIRED fields:
 * - name: Tên sản phẩm (2-500 ký tự)
 * - price: Giá bán (>= 0)
 * - categoryId: ID danh mục (bắt buộc)
 *
 * OPTIONAL fields:
 * - description: Mô tả dài (HTML cho WYSIWYG editor)
 * - shortDesc: Mô tả ngắn (hiển thị ở listing)
 * - sku: Mã sản phẩm (Stock Keeping Unit)
 * - stockQuantity: Số lượng tồn kho
 * - status: Trạng thái (DRAFT/PUBLISHED/HIDDEN/DISCONTINUED)
 */
export const createProductSchema = z.object({
    name: z
        .string()
        .min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự')
        .max(500, 'Tên sản phẩm tối đa 500 ký tự'),
    description: z.string().optional(),
    shortDesc: z.string().max(500).optional(),
    // z.coerce: Tự động convert string → number (FormData luôn gửi string)
    price: z.coerce
        .number()
        .min(0, 'Giá không được âm'),
    stockQuantity: z.coerce.number().int().min(0).default(0),
    sku: z.string().optional(),
    categoryId: z.string(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'DISCONTINUED']).default('DRAFT'),
    // Images: Array of image objects
    images: z
        .array(z.object({
        url: z.string().url('URL ảnh không hợp lệ'),
        isThumbnail: z.boolean().default(false),
        sortOrder: z.number().int().optional(),
    }))
        .optional(),
});
// ============================================================================
// UPDATE PRODUCT SCHEMA
// ============================================================================
/**
 * Schema cho PUT /api/products/:id
 *
 * Tất cả fields đều optional (partial update)
 * Chỉ validate các fields được truyền
 *
 * .nullable(): Cho phép gửi null để xóa giá trị
 * VD: { "shortDesc": null } → Xóa shortDesc
 */
export const updateProductSchema = z.object({
    name: z.string().min(2).max(500).optional(),
    description: z.string().optional().nullable(),
    shortDesc: z.string().max(500).optional().nullable(),
    // z.coerce: Tự động convert string → number (FormData luôn gửi string)
    price: z.coerce.number().min(0).optional(),
    stockQuantity: z.coerce.number().int().min(0).optional(),
    sku: z.string().optional().nullable(),
    categoryId: z.string().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'DISCONTINUED']).optional(),
    // Nếu truyền images → replace tất cả images hiện tại
    images: z
        .array(z.object({
        url: z.string().url(),
        isThumbnail: z.boolean().default(false),
        sortOrder: z.number().int().optional(),
    }))
        .optional(),
});
// ============================================================================
// QUERY PARAMS SCHEMA
// ============================================================================
/**
 * Schema cho query parameters (GET /api/products?...)
 *
 * z.coerce: Tự động convert type
 * - z.coerce.number(): "12" → 12
 * - z.coerce.boolean(): "true" → true
 *
 * LƯU Ý: Query params từ URL luôn là string,
 * nên phải dùng coerce để convert
 */
export const productQuerySchema = z.object({
    // Pagination
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(12),
    // Filters
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN', 'DISCONTINUED']).optional(),
    categoryId: z.string().optional(),
    categorySlug: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    // Search
    search: z.string().optional(),
    // Sorting
    sortBy: z.enum(['createdAt', 'price', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
//# sourceMappingURL=product.schema.js.map