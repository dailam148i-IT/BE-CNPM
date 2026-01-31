/**
 * =============================================================================
 * NEWS.SCHEMA.TS - Validation schemas cho News/Blog
 * =============================================================================
 */

import { z } from 'zod';

export const createNewsSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Tiêu đề là bắt buộc').max(255),
    description: z.string().max(1000).optional().nullable(),
    content: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).default('DRAFT'),
  }),
});

export const updateNewsSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().max(1000).optional().nullable(),
    content: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    imageUrl: z.string().url().optional().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
  }),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const queryNewsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
    status: z.enum(['DRAFT', 'PUBLISHED', 'HIDDEN']).optional(),
    categoryId: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'publishedAt', 'title']).default('publishedAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type CreateNewsInput = z.infer<typeof createNewsSchema>;
export type UpdateNewsInput = z.infer<typeof updateNewsSchema>;
export type QueryNewsInput = z.infer<typeof queryNewsSchema>;
