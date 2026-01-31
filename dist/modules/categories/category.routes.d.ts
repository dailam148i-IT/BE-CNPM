/**
 * =============================================================================
 * CATEGORY.ROUTES.TS - Định nghĩa Routes cho Categories
 * =============================================================================
 *
 * File này định nghĩa tất cả API endpoints của Category module
 *
 * ROUTE STRUCTURE:
 *   router.[method](path, [middlewares...], handler)
 *
 * MIDDLEWARE ORDER:
 * 1. authenticate - Kiểm tra JWT token (ai đang request)
 * 2. authorize - Kiểm tra role (có quyền không)
 * 3. validate - Validate request body/params
 * 4. controller - Xử lý request
 *
 * ENDPOINTS:
 * GET    /api/categories         - Public: Danh sách categories
 * GET    /api/categories/tree    - Public: Category tree cho menu
 * GET    /api/categories/:slug   - Public: Chi tiết theo slug
 * POST   /api/categories         - Admin: Tạo mới
 * PUT    /api/categories/:id     - Admin: Cập nhật
 * DELETE /api/categories/:id     - Admin: Xóa
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=category.routes.d.ts.map