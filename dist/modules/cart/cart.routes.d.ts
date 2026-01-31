/**
 * =============================================================================
 * CART.ROUTES.TS - Định nghĩa Routes cho Cart Module
 * =============================================================================
 *
 * Cart API endpoints - Tất cả đều yêu cầu authentication
 *
 * ENDPOINTS:
 * GET    /api/cart              - Lấy giỏ hàng hiện tại
 * POST   /api/cart/items        - Thêm sản phẩm vào giỏ
 * PUT    /api/cart/items/:itemId - Cập nhật số lượng
 * DELETE /api/cart/items/:itemId - Xóa sản phẩm khỏi giỏ
 * DELETE /api/cart              - Xóa toàn bộ giỏ hàng
 * POST   /api/cart/sync         - Đồng bộ giỏ hàng từ localStorage
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=cart.routes.d.ts.map