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
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=news.routes.d.ts.map