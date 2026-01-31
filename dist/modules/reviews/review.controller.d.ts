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
export declare const reviewController: {
    /**
     * GET /api/products/:productId/reviews
     * Lấy danh sách reviews của sản phẩm
     */
    getByProduct(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/products/:productId/reviews
     * Tạo review mới (yêu cầu đăng nhập)
     */
    create(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/reviews/:id
     * Cập nhật review (chỉ owner)
     */
    update(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/reviews/:id
     * Xóa review (owner hoặc admin)
     */
    delete(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/products/:productId/reviews/mine
     * Check xem user đã review chưa
     */
    getMyReview(req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=review.controller.d.ts.map