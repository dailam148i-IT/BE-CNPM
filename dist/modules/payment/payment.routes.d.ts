/**
 * =============================================================================
 * PAYMENT.ROUTES.TS - Routes cho Thanh toán SePay
 * =============================================================================
 *
 * Base path: /api/payment
 *
 * ROUTES:
 * - POST /sepay-webhook          → SePay gọi khi có giao dịch (Public)
 * - GET  /qr/:orderId            → Tạo QR thanh toán (Authenticated)
 * - GET  /status/:orderId        → Kiểm tra trạng thái (Authenticated)
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=payment.routes.d.ts.map