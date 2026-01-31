/**
 * =============================================================================
 * REVIEW.CONTROLLER.TS - Xử lý Request/Response cho Reviews
 * =============================================================================
 * 
 * Controller là cầu nối giữa Routes và Service
 * 
 * NHIỆM VỤ:
 * - Nhận request từ client
 * - Extract dữ liệu từ req.body, req.params, req.query
 * - Gọi Service xử lý logic
 * - Trả response về client
 * 
 * KHÔNG LÀM:
 * - Business logic (đó là việc của Service)
 * - Truy vấn database trực tiếp
 * - Validation (đó là việc của Schema)
 */

import { Request, Response } from 'express';
import { reviewService } from './review.service.js';
import { success } from '../../utils/response.js';

export const reviewController = {
  /**
   * GET /api/products/:productId/reviews
   * Lấy danh sách reviews của sản phẩm
   */
  async getByProduct(req: Request, res: Response) {
    const { productId } = req.params;
    const { page, limit, rating, sortBy, sortOrder } = req.query;

    const result = await reviewService.findByProduct(productId, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      rating: rating ? Number(rating) : undefined,
      sortBy: sortBy as 'createdAt' | 'rating' | undefined,
      sortOrder: sortOrder as 'asc' | 'desc' | undefined,
    });

    success(res, result);
  },

  /**
   * POST /api/products/:productId/reviews
   * Tạo review mới (yêu cầu đăng nhập)
   */
  async create(req: Request, res: Response) {
    const { productId } = req.params;
    const { rating, commentText } = req.body;
    const userId = req.user!.userId;

    const review = await reviewService.create({
      userId,
      productId,
      rating,
      commentText,
    });

    success(res, review, 201);
  },

  /**
   * PUT /api/reviews/:id
   * Cập nhật review (chỉ owner)
   */
  async update(req: Request, res: Response) {
    const { id } = req.params;
    const { rating, commentText } = req.body;
    const userId = req.user!.userId;

    const review = await reviewService.update(id, userId, {
      rating,
      commentText,
    });

    success(res, review);
  },

  /**
   * DELETE /api/reviews/:id
   * Xóa review (owner hoặc admin)
   */
  async delete(req: Request, res: Response) {
    const { id } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user!.role === 'ADMIN';

    const result = await reviewService.delete(id, userId, isAdmin);

    success(res, result);
  },

  /**
   * GET /api/products/:productId/reviews/mine
   * Check xem user đã review chưa
   */
  async getMyReview(req: Request, res: Response) {
    const { productId } = req.params;
    const userId = req.user!.userId;

    const review = await reviewService.findUserReview(userId, productId);

    success(res, { hasReviewed: !!review, review });
  },
};
