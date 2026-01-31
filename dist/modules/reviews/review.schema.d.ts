/**
 * =============================================================================
 * REVIEW.SCHEMA.TS - Validation schemas cho Reviews
 * =============================================================================
 */
import { z } from 'zod';
/**
 * Schema tạo review mới
 */
export declare const createReviewSchema: z.ZodObject<{
    body: z.ZodObject<{
        rating: z.ZodNumber;
        commentText: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        rating: number;
        commentText?: string | null | undefined;
    }, {
        rating: number;
        commentText?: string | null | undefined;
    }>;
    params: z.ZodObject<{
        productId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        productId: string;
    }, {
        productId: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        productId: string;
    };
    body: {
        rating: number;
        commentText?: string | null | undefined;
    };
}, {
    params: {
        productId: string;
    };
    body: {
        rating: number;
        commentText?: string | null | undefined;
    };
}>;
/**
 * Schema cập nhật review
 */
export declare const updateReviewSchema: z.ZodObject<{
    body: z.ZodObject<{
        rating: z.ZodOptional<z.ZodNumber>;
        commentText: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        rating?: number | undefined;
        commentText?: string | null | undefined;
    }, {
        rating?: number | undefined;
        commentText?: string | null | undefined;
    }>;
    params: z.ZodObject<{
        id: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
    }, {
        id: string;
    }>;
}, "strip", z.ZodTypeAny, {
    params: {
        id: string;
    };
    body: {
        rating?: number | undefined;
        commentText?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        rating?: number | undefined;
        commentText?: string | null | undefined;
    };
}>;
/**
 * Schema query reviews
 */
export declare const queryReviewsSchema: z.ZodObject<{
    params: z.ZodObject<{
        productId: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        productId: string;
    }, {
        productId: string;
    }>;
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        rating: z.ZodOptional<z.ZodNumber>;
        sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "rating"]>>;
        sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortOrder: "asc" | "desc";
        sortBy: "createdAt" | "rating";
        rating?: number | undefined;
    }, {
        page?: number | undefined;
        limit?: number | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        sortBy?: "createdAt" | "rating" | undefined;
        rating?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortOrder: "asc" | "desc";
        sortBy: "createdAt" | "rating";
        rating?: number | undefined;
    };
    params: {
        productId: string;
    };
}, {
    query: {
        page?: number | undefined;
        limit?: number | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        sortBy?: "createdAt" | "rating" | undefined;
        rating?: number | undefined;
    };
    params: {
        productId: string;
    };
}>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type QueryReviewsInput = z.infer<typeof queryReviewsSchema>;
//# sourceMappingURL=review.schema.d.ts.map