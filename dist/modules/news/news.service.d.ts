/**
 * =============================================================================
 * NEWS.SERVICE.TS - Business Logic cho Tin tức/Bài viết
 * =============================================================================
 *
 * Service này xử lý tất cả logic liên quan đến tin tức và bài viết
 *
 * NHIỆM VỤ:
 * - CRUD tin tức (tạo, đọc, sửa, xóa)
 * - Tự động tạo slug từ tiêu đề
 * - Quản lý trạng thái (DRAFT, PUBLISHED, HIDDEN)
 * - Cập nhật ngày publish khi chuyển trạng thái
 *
 * QUY TẮC:
 * - Người dùng thường chỉ thấy bài viết PUBLISHED
 * - Admin/Staff thấy tất cả trạng thái
 * - Slug phải duy nhất (tự động thêm số nếu trùng)
 */
/**
 * Interface cho dữ liệu tạo tin tức mới
 */
interface CreateNewsData {
    authorId: string;
    title: string;
    description?: string | null;
    content?: string | null;
    categoryId?: string | null;
    imageUrl?: string | null;
    status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
}
interface UpdateNewsData {
    title?: string;
    description?: string | null;
    content?: string | null;
    categoryId?: string | null;
    imageUrl?: string | null;
    status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
}
interface QueryOptions {
    page?: number;
    limit?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
    categoryId?: string;
    search?: string;
    sortBy?: 'createdAt' | 'publishedAt' | 'title';
    sortOrder?: 'asc' | 'desc';
}
export declare const newsService: {
    /**
     * Lấy danh sách tin tức
     */
    findAll(options?: QueryOptions, isAdmin?: boolean): Promise<{
        news: ({
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
            author: {
                username: string;
                fullName: string | null;
                id: string;
            };
        } & {
            status: import(".prisma/client").$Enums.NewsStatus;
            id: string;
            description: string | null;
            slug: string;
            categoryId: string | null;
            imageUrl: string | null;
            title: string;
            publishedAt: Date;
            authorId: string;
            content: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Lấy tin tức theo ID
     */
    findById(id: string): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
        author: {
            username: string;
            fullName: string | null;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.NewsStatus;
        id: string;
        description: string | null;
        slug: string;
        categoryId: string | null;
        imageUrl: string | null;
        title: string;
        publishedAt: Date;
        authorId: string;
        content: string | null;
    }>;
    /**
     * Lấy tin tức theo slug (public)
     */
    findBySlug(slug: string): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
        author: {
            username: string;
            fullName: string | null;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.NewsStatus;
        id: string;
        description: string | null;
        slug: string;
        categoryId: string | null;
        imageUrl: string | null;
        title: string;
        publishedAt: Date;
        authorId: string;
        content: string | null;
    }>;
    /**
     * Tạo tin tức mới
     */
    create(data: CreateNewsData): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
        author: {
            username: string;
            fullName: string | null;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.NewsStatus;
        id: string;
        description: string | null;
        slug: string;
        categoryId: string | null;
        imageUrl: string | null;
        title: string;
        publishedAt: Date;
        authorId: string;
        content: string | null;
    }>;
    /**
     * Cập nhật tin tức
     */
    update(id: string, data: UpdateNewsData): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
        } | null;
        author: {
            username: string;
            fullName: string | null;
            id: string;
        };
    } & {
        status: import(".prisma/client").$Enums.NewsStatus;
        id: string;
        description: string | null;
        slug: string;
        categoryId: string | null;
        imageUrl: string | null;
        title: string;
        publishedAt: Date;
        authorId: string;
        content: string | null;
    }>;
    /**
     * Xóa tin tức
     */
    delete(id: string): Promise<{
        message: string;
    }>;
};
export {};
//# sourceMappingURL=news.service.d.ts.map