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
export declare const paymentController: {
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
    handleSePayWebhook(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * =========================================================================
     * GET SEPAY TRANSACTION HISTORY (Admin - Xem lịch sử)
     * =========================================================================
     *
     * GET /api/payment/sepay-history
     *
     * Lấy lịch sử giao dịch trực tiếp từ SePay API để đối soát
     */
    getSePayHistory(req: any, res: any, next: any): Promise<void>;
    /**
     * =========================================================================
     * GET TRANSACTIONS (Admin)
     * =========================================================================
     *
     * GET /api/payment/transactions
     */
    getTransactions(req: any, res: any, next: any): Promise<void>;
    /**
     * =========================================================================
     * SYNC TRANSACTIONS (Admin)
     * =========================================================================
     *
     * POST /api/payment/sync
     */
    syncTransactions(req: any, res: any, next: any): Promise<void>;
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
    generateQRCode(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    getPaymentStatus(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    createTestOrder(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=payment.controller.d.ts.map