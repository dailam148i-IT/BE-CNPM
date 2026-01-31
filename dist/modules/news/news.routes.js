/**
 * =============================================================================
 * NEWS.ROUTES.TS - API Routes cho News/Blog
 * =============================================================================
 *
 * PUBLIC ROUTES:
 * - GET /api/news           - Danh sách tin tức (PUBLISHED only)
 * - GET /api/news/:slug     - Chi tiết tin tức theo slug
 *
 * ADMIN ROUTES:
 * - GET    /api/admin/news      - Danh sách tất cả tin tức
 * - GET    /api/admin/news/:id  - Chi tiết tin tức theo ID
 * - POST   /api/admin/news      - Tạo tin tức mới
 * - PUT    /api/admin/news/:id  - Cập nhật tin tức
 * - DELETE /api/admin/news/:id  - Xóa tin tức
 */
import { Router } from 'express';
import { newsController } from './news.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../middleware/errorHandler.js';
const router = Router();
// ================================================================
// PUBLIC ROUTES
// ================================================================
router.get('/news', asyncHandler(newsController.getAll));
router.get('/news/:slug', asyncHandler(newsController.getBySlug));
// ================================================================
// ADMIN ROUTES
// ================================================================
router.get('/admin/news', authenticate, authorize('ADMIN', 'STAFF'), asyncHandler(newsController.getAllAdmin));
router.get('/admin/news/:id', authenticate, authorize('ADMIN', 'STAFF'), asyncHandler(newsController.getById));
router.post('/admin/news', authenticate, authorize('ADMIN', 'STAFF'), asyncHandler(newsController.create));
router.put('/admin/news/:id', authenticate, authorize('ADMIN', 'STAFF'), asyncHandler(newsController.update));
router.delete('/admin/news/:id', authenticate, authorize('ADMIN'), asyncHandler(newsController.delete));
export default router;
//# sourceMappingURL=news.routes.js.map