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
import { cartService } from './cart.service.js';

export const cartController = {
  /**
   * getCart - Lấy giỏ hàng hiện tại
   * 
   * Route: GET /api/cart
   * Access: Authenticated
   */
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cart = await cartService.getCart(userId);

      if (!cart) {
        // Return empty cart structure
        return res.json({
          success: true,
          data: {
            id: null,
            userId,
            items: [],
            totalItems: 0,
            totalAmount: 0,
          },
        });
      }

      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

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
  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cart = await cartService.addItem(userId, req.body);
      res.status(201).json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

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
  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { itemId } = req.params;
      const cart = await cartService.updateItem(userId, itemId, req.body);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

  /**
   * removeItem - Xóa sản phẩm khỏi giỏ hàng
   * 
   * Route: DELETE /api/cart/items/:itemId
   * Access: Authenticated
   */
  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { itemId } = req.params;
      const cart = await cartService.removeItem(userId, itemId);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

  /**
   * clearCart - Xóa toàn bộ giỏ hàng
   * 
   * Route: DELETE /api/cart
   * Access: Authenticated
   */
  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cart = await cartService.clearCart(userId);
      res.json({ success: true, data: cart, message: 'Đã xóa giỏ hàng' });
    } catch (error) {
      next(error);
    }
  },

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
  async syncCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const cart = await cartService.syncCart(userId, req.body);
      res.json({ success: true, data: cart, message: 'Đồng bộ giỏ hàng thành công' });
    } catch (error) {
      next(error);
    }
  },
};
