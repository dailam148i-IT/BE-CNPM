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
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    shortDesc: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    stockQuantity: z.ZodDefault<z.ZodNumber>;
    sku: z.ZodOptional<z.ZodString>;
    categoryId: z.ZodString;
    status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED", "HIDDEN", "DISCONTINUED"]>>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        isThumbnail: z.ZodDefault<z.ZodBoolean>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        isThumbnail: boolean;
        url: string;
        sortOrder?: number | undefined;
    }, {
        url: string;
        isThumbnail?: boolean | undefined;
        sortOrder?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DISCONTINUED";
    name: string;
    price: number;
    stockQuantity: number;
    categoryId: string;
    description?: string | undefined;
    shortDesc?: string | undefined;
    sku?: string | undefined;
    images?: {
        isThumbnail: boolean;
        url: string;
        sortOrder?: number | undefined;
    }[] | undefined;
}, {
    name: string;
    price: number;
    categoryId: string;
    status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DISCONTINUED" | undefined;
    description?: string | undefined;
    shortDesc?: string | undefined;
    stockQuantity?: number | undefined;
    sku?: string | undefined;
    images?: {
        url: string;
        isThumbnail?: boolean | undefined;
        sortOrder?: number | undefined;
    }[] | undefined;
}>;
/**
 * Schema cho PUT /api/products/:id
 *
 * Tất cả fields đều optional (partial update)
 * Chỉ validate các fields được truyền
 *
 * .nullable(): Cho phép gửi null để xóa giá trị
 * VD: { "shortDesc": null } → Xóa shortDesc
 */
export declare const updateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    shortDesc: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodNumber>;
    stockQuantity: z.ZodOptional<z.ZodNumber>;
    sku: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "HIDDEN", "DISCONTINUED"]>>;
    images: z.ZodOptional<z.ZodArray<z.ZodObject<{
        url: z.ZodString;
        isThumbnail: z.ZodDefault<z.ZodBoolean>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        isThumbnail: boolean;
        url: string;
        sortOrder?: number | undefined;
    }, {
        url: string;
        isThumbnail?: boolean | undefined;
        sortOrder?: number | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DISCONTINUED" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    shortDesc?: string | null | undefined;
    price?: number | undefined;
    stockQuantity?: number | undefined;
    sku?: string | null | undefined;
    categoryId?: string | undefined;
    images?: {
        isThumbnail: boolean;
        url: string;
        sortOrder?: number | undefined;
    }[] | undefined;
}, {
    status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DISCONTINUED" | undefined;
    name?: string | undefined;
    description?: string | null | undefined;
    shortDesc?: string | null | undefined;
    price?: number | undefined;
    stockQuantity?: number | undefined;
    sku?: string | null | undefined;
    categoryId?: string | undefined;
    images?: {
        url: string;
        isThumbnail?: boolean | undefined;
        sortOrder?: number | undefined;
    }[] | undefined;
}>;
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
export declare const productQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "HIDDEN", "DISCONTINUED"]>>;
    categoryId: z.ZodOptional<z.ZodString>;
    categorySlug: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodNumber>;
    maxPrice: z.ZodOptional<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "price", "name"]>>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sortOrder: "asc" | "desc";
    sortBy: "createdAt" | "name" | "price";
    search?: string | undefined;
    status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DISCONTINUED" | undefined;
    categoryId?: string | undefined;
    categorySlug?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
}, {
    search?: string | undefined;
    status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | "DISCONTINUED" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    categoryId?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
    categorySlug?: string | undefined;
    minPrice?: number | undefined;
    maxPrice?: number | undefined;
    sortBy?: "createdAt" | "name" | "price" | undefined;
}>;
/**
 * Export TypeScript types từ schemas
 *
 * Dùng z.infer để tự động tạo types
 * Không cần viết interface riêng
 *
 * BẤT CỨ KHI NÀO THAY ĐỔI SCHEMA → TYPES TỰ ĐỘNG CẬP NHẬT
 */
export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type ProductQueryDto = z.infer<typeof productQuerySchema>;
//# sourceMappingURL=product.schema.d.ts.map