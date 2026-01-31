/**
 * =============================================================================
 * NEWS.CONTROLLER.TS - Request handlers cho News/Blog
 * =============================================================================
 */
import { newsService } from './news.service.js';
import { success } from '../../utils/response.js';
export const newsController = {
    /**
     * GET /api/news - Public, chỉ lấy PUBLISHED
     */
    async getAll(req, res) {
        const result = await newsService.findAll(req.query, false);
        success(res, result);
    },
    /**
     * GET /api/admin/news - Admin, lấy tất cả status
     */
    async getAllAdmin(req, res) {
        const result = await newsService.findAll(req.query, true);
        success(res, result);
    },
    /**
     * GET /api/news/:slug - Public, lấy theo slug
     */
    async getBySlug(req, res) {
        const { slug } = req.params;
        const news = await newsService.findBySlug(slug);
        success(res, news);
    },
    /**
     * GET /api/admin/news/:id - Admin, lấy theo ID
     */
    async getById(req, res) {
        const { id } = req.params;
        const news = await newsService.findById(id);
        success(res, news);
    },
    /**
     * POST /api/admin/news - Tạo bài viết mới
     */
    async create(req, res) {
        const authorId = req.user.userId;
        const news = await newsService.create({
            ...req.body,
            authorId,
        });
        success(res, news, 201);
    },
    /**
     * PUT /api/admin/news/:id - Cập nhật bài viết
     */
    async update(req, res) {
        const { id } = req.params;
        const news = await newsService.update(id, req.body);
        success(res, news);
    },
    /**
     * DELETE /api/admin/news/:id - Xóa bài viết
     */
    async delete(req, res) {
        const { id } = req.params;
        const result = await newsService.delete(id);
        success(res, result);
    },
};
//# sourceMappingURL=news.controller.js.map