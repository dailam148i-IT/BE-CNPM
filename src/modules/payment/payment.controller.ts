/**
 * =============================================================================
 * PAYMENT.CONTROLLER.TS - Request Handlers cho Thanh toán
 * =============================================================================
 * 
 * ENDPOINTS:
 * - POST /api/payment/sepay-webhook  → Nhận webhook từ SePay (Public, có verify)
 * - GET  /api/payment/qr/:orderId    → Tạo QR Code thanh toán (Authenticated)
 * - GET  /api/payment/status/:orderId → Kiểm tra trạng thái (Authenticated)
 */

import { Request, Response, NextFunction } from 'express';
import { paymentService, SePayWebhookPayload } from './payment.service.js';

export const paymentController = {
  /**
   * =========================================================================
   * SEPAY WEBHOOK HANDLER
   * =========================================================================
   * 
   * Route: POST /api/payment/sepay-webhook
   * Access: Public (SePay gọi đến)
   * 
   * ⚠️ QUAN TRỌNG:
   * - Endpoint này KHÔNG cần authentication
   * - Nhưng cần verify API Key để đảm bảo request từ SePay
   * - Response 200 để SePay biết đã nhận, tránh retry
   * 
   * SePay gửi header: Authorization: Apikey {YOUR_API_KEY}
   */
  async handleSePayWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = req.body as SePayWebhookPayload;
      
      // Verify API Key từ header Authorization
      const authHeader = req.headers['authorization'] as string;
      const expectedApiKey = process.env.SEPAY_API_KEY; // IPN Secret Key
      
      console.log('[SePay Webhook] Received request');
      
      if (expectedApiKey) {
        // SePay có thể gửi format: "Apikey {key}" hoặc "Bearer {key}" hoặc chỉ "{key}"
        const providedKey = authHeader?.replace(/^(Apikey|Bearer)\s+/i, '') || authHeader;
        
        if (providedKey !== expectedApiKey) {
          console.warn('[SePay Webhook] Invalid API Key. Received:', providedKey);
          return res.status(401).json({ success: false, message: 'Invalid API Key' });
        }
      } else {
        console.warn('[SePay Webhook] SEPAY_API_KEY not configured, skipping verification');
      }

      console.log('[SePay Webhook] Received:', {
        id: payload.id,
        gateway: payload.gateway,
        amount: payload.transferAmount,
        content: payload.content,
      });

      // Xử lý webhook
      const result = await paymentService.handleWebhook(payload);

      // Luôn trả 200 để SePay không retry
      res.json({
        success: result.success,
        message: result.message,
        orderId: result.orderId,
      });
    } catch (error) {
      console.error('[SePay Webhook] Error:', error);
      // Vẫn trả 200 để tránh SePay retry vô hạn
      res.json({ success: false, message: 'Internal error' });
    }
  },

  /**
   * =========================================================================
   * GET SEPAY TRANSACTION HISTORY (Admin - Xem lịch sử)
   * =========================================================================
   * 
   * GET /api/payment/sepay-history
   * 
   * Lấy lịch sử giao dịch trực tiếp từ SePay API để đối soát
   */
  async getSePayHistory(req: any, res: any, next: any) {
    try {
      const limit = Number(req.query.limit) || 50;
      const result = await paymentService.getSePayHistory(limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * =========================================================================
   * GET TRANSACTIONS (Admin)
   * =========================================================================
   * 
   * GET /api/payment/transactions
   */
  async getTransactions(req: any, res: any, next: any) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;

      const result = await paymentService.getTransactions(page, limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * =========================================================================
   * SYNC TRANSACTIONS (Admin)
   * =========================================================================
   * 
   * POST /api/payment/sync
   */
  async syncTransactions(req: any, res: any, next: any) {
    try {
      const limit = Number(req.body.limit) || 20;
      const result = await paymentService.syncBankTransactions(limit);
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  /**
   * =========================================================================
   * GENERATE QR CODE
   * =========================================================================
   * 
   * Route: GET /api/payment/qr/:orderId
   * Access: Authenticated (chủ đơn hàng)
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "qrUrl": "https://img.vietqr.io/image/...",
   *     "orderCode": "DH12345ABC",
   *     "amount": 150000,
   *     "bankInfo": { ... }
   *   }
   * }
   */
  async generateQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const result = await paymentService.generateQRCode(orderId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * =========================================================================
   * GET PAYMENT STATUS
   * =========================================================================
   * 
   * Route: GET /api/payment/status/:orderId
   * Access: Authenticated
   * 
   * Dùng cho frontend polling kiểm tra đã thanh toán chưa
   * 
   * Response:
   * {
   *   "success": true,
   *   "data": {
   *     "orderId": "...",
   *     "paymentStatus": "PAID" | "UNPAID",
   *     "paidAt": "2026-01-31T..."
   *   }
   * }
   */
  async getPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const result = await paymentService.getPaymentStatus(orderId);

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  /**
   * =========================================================================
   * CREATE TEST ORDER (Development only)
   * =========================================================================
   * 
   * Route: POST /api/payment/test-order
   * Access: Authenticated
   * 
   * Tạo đơn hàng test với số tiền random (5000-10000đ) để test thanh toán
   * Trả về luôn QR code để scan
   */
  async createTestOrder(req: Request, res: Response, next: NextFunction) {
    try {
      // Lấy userId từ request hoặc dùng null cho guest order
      const userId = (req as any).user?.id || null;

      const result = await paymentService.createTestOrder(userId);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },
};
