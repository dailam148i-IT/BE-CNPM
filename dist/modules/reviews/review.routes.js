/**
 * =============================================================================
 * REVIEW.ROUTES.TS - API Routes cho Reviews
 * =============================================================================
 *
 * Routes:
 * - GET    /api/products/:productId/reviews      - Lấy reviews của sản phẩm
 * - GET    /api/products/:productId/reviews/mine - Check user đã review chưa
 * - POST   /api/products/:productId/reviews      - Tạo review mới
 * - PUT    /api/reviews/:id                      - Cập nhật review
 * - DELETE /api/reviews/:id                      - Xóa review
 */
import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
const router = Router();
// ================================================================
// PUBLIC ROUTES (có thể dùng optionalAuth để biết user nếu có)
// ================================================================
/**
 * GET /api/products/:productId/reviews
 * Lấy danh sách reviews của sản phẩm
 */
router.get('/products/:productId/reviews', asyncHandler(reviewController.getByProduct));
// ================================================================
// PROTECTED ROUTES (yêu cầu đăng nhập)
// ================================================================
/**
 * GET /api/products/:productId/reviews/mine
 * Check xem user hiện tại đã review sản phẩm này chưa
 */
router.get('/products/:productId/reviews/mine', authenticate, asyncHandler(reviewController.getMyReview));
/**
 * POST /api/products/:productId/reviews
 * Tạo review mới cho sản phẩm
 */
router.post('/products/:productId/reviews', authenticate, asyncHandler(reviewController.create));
/**
 * PUT /api/reviews/:id
 * Cập nhật review (chỉ owner)
 */
router.put('/reviews/:id', authenticate, asyncHandler(reviewController.update));
/**
 * DELETE /api/reviews/:id
 * Xóa review (owner hoặc admin)
 */
router.delete('/reviews/:id', authenticate, asyncHandler(reviewController.delete));
export default router;
//# sourceMappingURL=review.routes.js.map