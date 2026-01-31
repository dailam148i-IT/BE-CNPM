/**
 * =============================================================================
 * CART.CONTROLLER.TS - Xử lý Request/Response cho Cart
 * =============================================================================
 *
 * Controller nhận request, gọi service, trả response
 *
 * ENDPOINTS:
 * - GET    /api/cart              - Lấy cart hiện tại
 * - POST   /api/cart/items        - Thêm item vào cart
 * - PUT    /api/cart/items/:itemId - Cập nhật quantity
 * - DELETE /api/cart/items/:itemId - Xóa item
 * - DELETE /api/cart              - Xóa toàn bộ cart
 * - POST   /api/cart/sync         - Sync cart từ localStorage
 */
import { Request, Response, NextFunction } from 'express';
export declare const cartController: {
    /**
     * getCart - Lấy giỏ hàng hiện tại
     *
     * Route: GET /api/cart
     * Access: Authenticated
     */
    getCart(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * addItem - Thêm sản phẩm vào giỏ hàng
     *
     * Route: POST /api/cart/items
     * Access: Authenticated
     *
     * BODY:
     * {
     *   "productId": "abc123",
     *   "quantity": 2
     * }
     */
    addItem(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * updateItem - Cập nhật số lượng sản phẩm
     *
     * Route: PUT /api/cart/items/:itemId
     * Access: Authenticated
     *
     * BODY:
     * {
     *   "quantity": 3
     * }
     *
     * NOTE: quantity = 0 sẽ xóa item
     */
    updateItem(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * removeItem - Xóa sản phẩm khỏi giỏ hàng
     *
     * Route: DELETE /api/cart/items/:itemId
     * Access: Authenticated
     */
    removeItem(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * clearCart - Xóa toàn bộ giỏ hàng
     *
     * Route: DELETE /api/cart
     * Access: Authenticated
     */
    clearCart(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * syncCart - Đồng bộ cart từ localStorage khi user đăng nhập
     *
     * Route: POST /api/cart/sync
     * Access: Authenticated
     *
     * BODY:
     * {
     *   "items": [
     *     { "productId": "abc123", "quantity": 2 },
     *     { "productId": "xyz789", "quantity": 1 }
     *   ]
     * }
     *
     * USE CASE:
     * 1. Guest thêm sản phẩm vào cart (lưu localStorage)
     * 2. Guest login
     * 3. Frontend gọi sync để merge localStorage cart vào database
     */
    syncCart(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=cart.controller.d.ts.map