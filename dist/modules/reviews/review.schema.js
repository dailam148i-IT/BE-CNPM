/**
 * =============================================================================
 * REVIEW.SCHEMA.TS - Validation schemas cho Reviews
 * =============================================================================
 */
import { z } from 'zod';
/**
 * Schema tạo review mới
 */
export const createReviewSchema = z.object({
    body: z.object({
        rating: z
            .number()
            .int()
            .min(1, 'Rating tối thiểu là 1')
            .max(5, 'Rating tối đa là 5'),
        commentText: z
            .string()
            .max(1000, 'Comment tối đa 1000 ký tự')
            .optional()
            .nullable(),
    }),
    params: z.object({
        productId: z.string().min(1, 'Product ID is required'),
    }),
});
/**
 * Schema cập nhật review
 */
export const updateReviewSchema = z.object({
    body: z.object({
        rating: z
            .number()
            .int()
            .min(1, 'Rating tối thiểu là 1')
            .max(5, 'Rating tối đa là 5')
            .optional(),
        commentText: z
            .string()
            .max(1000, 'Comment tối đa 1000 ký tự')
            .optional()
            .nullable(),
    }),
    params: z.object({
        id: z.string().min(1, 'Review ID is required'),
    }),
});
/**
 * Schema query reviews
 */
export const queryReviewsSchema = z.object({
    params: z.object({
        productId: z.string().min(1, 'Product ID is required'),
    }),
    query: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(50).default(10),
        rating: z.coerce.number().int().min(1).max(5).optional(),
        sortBy: z.enum(['createdAt', 'rating']).default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc'),
    }),
});
//# sourceMappingURL=review.schema.js.map