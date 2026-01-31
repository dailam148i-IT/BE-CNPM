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
import { Router } from 'express';
import { paymentController } from './payment.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
const router = Router();
// ============================================================================
// PUBLIC ROUTES (SePay Webhook)
// ============================================================================
/**
 * POST /api/payment/sepay-webhook
 *
 * Endpoint nhận thông báo giao dịch từ SePay
 * KHÔNG cần authenticate vì SePay gọi từ bên ngoài
 */
router.post('/sepay-webhook', asyncHandler(paymentController.handleSePayWebhook));
// ============================================================================
// PROTECTED ROUTES (User phải đăng nhập)
// ============================================================================
/**
 * GET /api/payment/qr/:orderId
 *
 * Tạo QR Code VietQR cho đơn hàng
 */
router.get('/qr/:orderId', authenticate, asyncHandler(paymentController.generateQRCode));
/**
 * GET /api/payment/status/:orderId
 *
 * Kiểm tra trạng thái thanh toán (cho polling)
 */
router.get('/status/:orderId', authenticate, asyncHandler(paymentController.getPaymentStatus));
// ============================================================================
// ADMIN ROUTES (Cần thêm middleware verifyAdmin sau này)
// ============================================================================
/**
 * GET /api/payment/sepay-history
 *
 * Lấy lịch sử giao dịch trực tiếp từ SePay API (cho Admin đối soát)
 */
router.get('/sepay-history', authenticate, asyncHandler(paymentController.getSePayHistory));
/**
 * GET /api/payment/transactions
 *
 * Lấy lịch sử giao dịch (cho Admin Dashboard)
 */
router.get('/transactions', authenticate, asyncHandler(paymentController.getTransactions));
/**
 * POST /api/payment/sync
 *
 * Đồng bộ thủ công giao dịch từ SePay (cho Admin)
 */
router.post('/sync', authenticate, asyncHandler(paymentController.syncTransactions));
/**
 * POST /api/payment/test-order
 *
 * Tạo đơn hàng test 5000đ và trả về QR code (Development only)
 * Tạm thời không cần auth để dễ test
 */
router.post('/test-order', asyncHandler(paymentController.createTestOrder));
export default router;
//# sourceMappingURL=payment.routes.js.map