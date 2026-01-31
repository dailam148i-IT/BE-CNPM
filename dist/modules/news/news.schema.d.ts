/**
 * =============================================================================
 * NEWS.SCHEMA.TS - Validation schemas cho News/Blog
 * =============================================================================
 */
import { z } from 'zod';
export declare const createNewsSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodString;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        content: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        categoryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodDefault<z.ZodEnum<["DRAFT", "PUBLISHED", "HIDDEN"]>>;
    }, "strip", z.ZodTypeAny, {
        status: "DRAFT" | "PUBLISHED" | "HIDDEN";
        title: string;
        description?: string | null | undefined;
        categoryId?: string | null | undefined;
        imageUrl?: string | null | undefined;
        content?: string | null | undefined;
    }, {
        title: string;
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        description?: string | null | undefined;
        categoryId?: string | null | undefined;
        imageUrl?: string | null | undefined;
        content?: string | null | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    body: {
        status: "DRAFT" | "PUBLISHED" | "HIDDEN";
        title: string;
        description?: string | null | undefined;
        categoryId?: string | null | undefined;
        imageUrl?: string | null | undefined;
        content?: string | null | undefined;
    };
}, {
    body: {
        title: string;
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        description?: string | null | undefined;
        categoryId?: string | null | undefined;
        imageUrl?: string | null | undefined;
        content?: string | null | undefined;
    };
}>;
export declare const updateNewsSchema: z.ZodObject<{
    body: z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        content: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        categoryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        imageUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "HIDDEN"]>>;
    }, "strip", z.ZodTypeAny, {
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        description?: string | null | undefined;
        categoryId?: string | null | undefined;
        imageUrl?: string | null | undefined;
        title?: string | undefined;
        content?: string | null | undefined;
    }, {
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        description?: string | null | undefined;
        categoryId?: string | null | undefined;
        imageUrl?: string | null | undefined;
        title?: string | undefined;
        content?: string | null | undefined;
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
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        description?: string | null | undefined;
        categoryId?: string | null | undefined;
        imageUrl?: string | null | undefined;
        title?: string | undefined;
        content?: string | null | undefined;
    };
}, {
    params: {
        id: string;
    };
    body: {
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        description?: string | null | undefined;
        categoryId?: string | null | undefined;
        imageUrl?: string | null | undefined;
        title?: string | undefined;
        content?: string | null | undefined;
    };
}>;
export declare const queryNewsSchema: z.ZodObject<{
    query: z.ZodObject<{
        page: z.ZodDefault<z.ZodNumber>;
        limit: z.ZodDefault<z.ZodNumber>;
        status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "HIDDEN"]>>;
        categoryId: z.ZodOptional<z.ZodString>;
        search: z.ZodOptional<z.ZodString>;
        sortBy: z.ZodDefault<z.ZodEnum<["createdAt", "publishedAt", "title"]>>;
        sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
    }, "strip", z.ZodTypeAny, {
        page: number;
        limit: number;
        sortOrder: "asc" | "desc";
        sortBy: "createdAt" | "title" | "publishedAt";
        search?: string | undefined;
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        categoryId?: string | undefined;
    }, {
        search?: string | undefined;
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        categoryId?: string | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        sortBy?: "createdAt" | "title" | "publishedAt" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    query: {
        page: number;
        limit: number;
        sortOrder: "asc" | "desc";
        sortBy: "createdAt" | "title" | "publishedAt";
        search?: string | undefined;
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        categoryId?: string | undefined;
    };
}, {
    query: {
        search?: string | undefined;
        status?: "DRAFT" | "PUBLISHED" | "HIDDEN" | undefined;
        page?: number | undefined;
        limit?: number | undefined;
        categoryId?: string | undefined;
        sortOrder?: "asc" | "desc" | undefined;
        sortBy?: "createdAt" | "title" | "publishedAt" | undefined;
    };
}>;
export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
export type QueryNewsInput = z.infer<typeof queryNewsSchema>;
//# sourceMappingURL=news.schema.d.ts.map