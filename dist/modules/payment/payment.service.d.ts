/**
 * =============================================================================
 * PAYMENT.SERVICE.TS - Xử lý Logic Thanh toán SePay
 * =============================================================================
 *
 * Service này đảm nhiệm:
 * 1. Tạo QR Code VietQR cho đơn hàng
 * 2. Xử lý Webhook từ SePay khi có giao dịch
 * 3. Cập nhật trạng thái thanh toán đơn hàng
 *
 * 🔄 FLOW THANH TOÁN:
 *    [Order Created] → [Generate QR] → [Customer Scan & Pay]
 *                                              ↓
 *    [Order PAID] ← [Update Payment] ← [SePay Webhook]
 */
import { PaymentStatus } from '@prisma/client';
/**
 * Cấu trúc Webhook từ SePay
 *
 * SePay gửi POST request với JSON body này khi có giao dịch
 */
export interface SePayWebhookPayload {
    id: number;
    gateway: string;
    transactionDate: string;
    accountNumber: string;
    subAccount: string | null;
    transferType: 'in' | 'out';
    transferAmount: number;
    accumulated: number;
    code: string | null;
    content: string;
    referenceCode: string;
    description: string;
}
/**
 * Kết quả xử lý Webhook
 */
export interface WebhookResult {
    success: boolean;
    orderId?: string;
    message: string;
}
export declare const paymentService: {
    /**
     * =========================================================================
     * GENERATE QR CODE URL
     * =========================================================================
     *
     * Tạo URL hình ảnh QR Code VietQR cho đơn hàng
     *
     * VietQR Format:
     * https://img.vietqr.io/image/{BIN}-{ACCOUNT}-{TEMPLATE}.png
     *   ?amount={AMOUNT}
     *   &addInfo={CONTENT}
     *   &accountName={NAME}
     *
     * @param orderId - ID đơn hàng
     * @returns URL hình ảnh QR Code
     */
    generateQRCode(orderId: string): Promise<{
        qrUrl: string;
        orderCode: string;
        amount: number;
        bankInfo: {
            bankName: string;
            accountNumber: string;
            accountName: string;
            content?: string;
        };
    }>;
    /**
     * =========================================================================
     * HANDLE SEPAY WEBHOOK
     * =========================================================================
     *
     * Xử lý callback từ SePay khi có giao dịch ngân hàng
     *
     * FLOW:
     * 1. Validate transferType = 'in' (tiền vào)
     * 2. Parse mã đơn hàng từ content (DH...)
     * 3. Tìm đơn hàng tương ứng
     * 4. Verify số tiền khớp
     * 5. Update payment status → PAID
     * 6. Tạo Transaction record
     *
     * @param payload - JSON từ SePay webhook
     * @returns Kết quả xử lý
     */
    handleWebhook(payload: SePayWebhookPayload): Promise<WebhookResult>;
    /**
     * =========================================================================
     * GET PAYMENT STATUS
     * =========================================================================
     *
     * Lấy trạng thái thanh toán của đơn hàng (cho frontend polling)
     */
    getPaymentStatus(orderId: string): Promise<{
        orderId: string;
        paymentStatus: PaymentStatus;
        paidAt?: Date;
    }>;
    /**
     * =========================================================================
     * VERIFY WEBHOOK SIGNATURE (Optional)
     * =========================================================================
     *
     * Xác thực webhook đến từ SePay (nếu có cấu hình API Key)
     *
     * @param signature - Header X-Sepay-Signature
     * @param payload - Raw body string
     */
    verifySignature(signature: string, payload: string): boolean;
    /**
     * =========================================================================
     * GET TRANSACTIONS (Admin)
     * =========================================================================
     */
    getTransactions(page?: number, limit?: number): Promise<{
        data: ({
            order: {
                user: {
                    email: string;
                    fullName: string | null;
                } | null;
                status: import(".prisma/client").$Enums.OrderStatus;
                id: string;
                totalMoney: import("@prisma/client/runtime/library").Decimal;
            };
        } & {
            status: import(".prisma/client").$Enums.TransactionStatus;
            id: string;
            description: string | null;
            orderId: string;
            paymentMethod: string;
            transactionCode: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            paidAt: Date;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    /**
     * =========================================================================
     * GET SEPAY TRANSACTION HISTORY (Admin - Xem lịch sử giao dịch)
     * =========================================================================
     *
     * Lấy lịch sử giao dịch trực tiếp từ SePay API để hiển thị trong admin dashboard
     * Không sync vào database, chỉ để đối soát
     */
    getSePayHistory(limit?: number): Promise<{
        success: boolean;
        data: any;
        total: any;
        bankAccount: string;
    }>;
    /**
     * =========================================================================
     * SYNC TRANSACTIONS FROM SEPAY (Manual Trigger)
     * =========================================================================
     */
    syncBankTransactions(limit?: number): Promise<{
        success: boolean;
        message: string;
        details: {
            fetched: any;
            processed: number;
            errors: {
                id: any;
                error: any;
            }[];
        };
    }>;
    /**
     * =========================================================================
     * CREATE TEST ORDER (Development only)
     * =========================================================================
     *
     * Tạo đơn hàng test với số tiền cố định 5000đ để test thanh toán
     * Trả về luôn QR code để scan
     */
    createTestOrder(userId: string): Promise<{
        qrUrl: string;
        orderCode: string;
        amount: number;
        bankInfo: {
            bankName: string;
            accountNumber: string;
            accountName: string;
            content?: string;
        };
        order: {
            id: string;
            amount: number;
            status: import(".prisma/client").$Enums.OrderStatus;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        };
    }>;
};
//# sourceMappingURL=payment.service.d.ts.map