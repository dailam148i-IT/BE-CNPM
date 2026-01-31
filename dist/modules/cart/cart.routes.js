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
import { Router } from 'express';
import { cartController } from './cart.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { addToCartSchema, updateCartItemSchema, syncCartSchema } from './cart.schema.js';
const router = Router();
// ============================================================================
// ALL ROUTES REQUIRE AUTHENTICATION
// ============================================================================
/**
 * GET /api/cart
 * Lấy giỏ hàng của user đang đăng nhập
 */
router.get('/', authenticate, cartController.getCart);
/**
 * POST /api/cart/items
 * Thêm sản phẩm vào giỏ hàng
 *
 * Body: { productId: string, quantity: number }
 */
router.post('/items', authenticate, validate(addToCartSchema), cartController.addItem);
/**
 * PUT /api/cart/items/:itemId
 * Cập nhật số lượng sản phẩm trong giỏ
 *
 * Body: { quantity: number }
 * - quantity = 0 → xóa item
 * - quantity > 0 → update
 */
router.put('/items/:itemId', authenticate, validate(updateCartItemSchema), cartController.updateItem);
/**
 * DELETE /api/cart/items/:itemId
 * Xóa sản phẩm khỏi giỏ hàng
 */
router.delete('/items/:itemId', authenticate, cartController.removeItem);
/**
 * DELETE /api/cart
 * Xóa toàn bộ giỏ hàng
 */
router.delete('/', authenticate, cartController.clearCart);
/**
 * POST /api/cart/sync
 * Đồng bộ giỏ hàng từ localStorage khi user đăng nhập
 *
 * Body: { items: [{ productId: string, quantity: number }] }
 */
router.post('/sync', authenticate, validate(syncCartSchema), cartController.syncCart);
export default router;
//# sourceMappingURL=cart.routes.js.map