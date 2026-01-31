/**
 * =============================================================================
 * NEWS.CONTROLLER.TS - Request handlers cho News/Blog
 * =============================================================================
 */

import { Request, Response } from 'express';
import { newsService } from './news.service.js';
import { success } from '../../utils/response.js';

export const newsController = {
  /**
   * GET /api/news - Public, chỉ lấy PUBLISHED
   */
  async getAll(req: Request, res: Response) {
    const result = await newsService.findAll(req.query as any, false);
    success(res, result);
  },

  /**
   * GET /api/admin/news - Admin, lấy tất cả status
   */
  async getAllAdmin(req: Request, res: Response) {
    const result = await newsService.findAll(req.query as any, true);
    success(res, result);
  },

  /**
   * GET /api/news/:slug - Public, lấy theo slug
   */
  async getBySlug(req: Request, res: Response) {
    const { slug } = req.params;
    const news = await newsService.findBySlug(slug);
    success(res, news);
  },

  /**
   * GET /api/admin/news/:id - Admin, lấy theo ID
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const news = await newsService.findById(id);
    success(res, news);
  },

  /**
   * POST /api/admin/news - Tạo bài viết mới
   */
  async create(req: Request, res: Response) {
    const authorId = req.user!.userId;
    const news = await newsService.create({
      ...req.body,
      authorId,
    });
    success(res, news, 201);
  },

  /**
   * PUT /api/admin/news/:id - Cập nhật bài viết
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const news = await newsService.update(id, req.body);
    success(res, news);
  },

  /**
   * DELETE /api/admin/news/:id - Xóa bài viết
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const result = await newsService.delete(id);
    success(res, result);
  },
};
