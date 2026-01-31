/**
 * =============================================================================
 * NEWS.CONTROLLER.TS - Request handlers cho News/Blog
 * =============================================================================
 */
import { Request, Response } from 'express';
export declare const newsController: {
    /**
     * GET /api/news - Public, chỉ lấy PUBLISHED
     */
    getAll(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/news - Admin, lấy tất cả status
     */
    getAllAdmin(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/news/:slug - Public, lấy theo slug
     */
    getBySlug(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/news/:id - Admin, lấy theo ID
     */
    getById(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/admin/news - Tạo bài viết mới
     */
    create(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/admin/news/:id - Cập nhật bài viết
     */
    update(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/admin/news/:id - Xóa bài viết
     */
    delete(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=news.controller.d.ts.map