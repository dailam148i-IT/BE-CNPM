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

import { PrismaClient, PaymentStatus, TransactionStatus } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';

const prisma = new PrismaClient();

// ============================================================================
// CẤU HÌNH NGÂN HÀNG - VietinBank
// ============================================================================

/**
 * Thông tin ngân hàng nhận thanh toán
 * 
 * BANK_BIN: Mã định danh ngân hàng trong hệ thống VietQR
 * - VietinBank: 970415
 * - MB Bank: 970422
 * - Vietcombank: 970436
 * - Techcombank: 970407
 */
const BANK_CONFIG = {
  BANK_BIN: '970415',           // VietinBank
  BANK_NAME: 'VietinBank',
  ACCOUNT_NUMBER: process.env.BANK_ACCOUNT_NUMBER || '',
  ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME || 'SHAN TEA',
};

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Cấu trúc Webhook từ SePay
 * 
 * SePay gửi POST request với JSON body này khi có giao dịch
 */
export interface SePayWebhookPayload {
  id: number;                    // ID giao dịch trên SePay
  gateway: string;               // Tên ngân hàng (VietinBank, MBBank...)
  transactionDate: string;       // Thời gian giao dịch
  accountNumber: string;         // Số tài khoản nhận
  subAccount: string | null;     // Tài khoản phụ (nếu có)
  transferType: 'in' | 'out';    // in = tiền vào, out = tiền ra
  transferAmount: number;        // Số tiền giao dịch (VND)
  accumulated: number;           // Số dư tích lũy
  code: string | null;           // Mã giao dịch (nếu có)
  content: string;               // Nội dung chuyển khoản (chứa mã đơn hàng)
  referenceCode: string;         // Mã tham chiếu ngân hàng
  description: string;           // Mô tả giao dịch
}

/**
 * Kết quả xử lý Webhook
 */
export interface WebhookResult {
  success: boolean;
  orderId?: string;
  message: string;
}

// ============================================================================
// SERVICE METHODS
// ============================================================================

export const paymentService = {
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
  async generateQRCode(orderId: string): Promise<{
    qrUrl: string;
    orderCode: string;
    amount: number;
    bankInfo: {
      bankName: string;
      accountNumber: string;
      accountName: string;
      content?: string;
    };
  }> {
    // Lấy thông tin đơn hàng
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    if (order.paymentStatus === 'PAID') {
      throw new Error('Đơn hàng đã được thanh toán');
    }

    // Tạo mã thanh toán unique (để SePay webhook match)
    // Format: DH{orderId cuối 8 ký tự}
    const orderCode = `DH${orderId.slice(-8).toUpperCase()}`;
    const amount = Number(order.totalMoney);

    // Build VietQR URL
    // Cấu trúc nội dung bắt buộc của SePay VA: SEVQR TKPLAM + {OrderCode}
    const content = `SEVQR TKPLAM ${orderCode}`;
    
    // Sử dụng API tạo QR của SePay hoặc VietQR đều được, nhưng cần đúng content
    // Ở đây dùng img.vietqr.io cho đơn giản
    const qrUrl = new URL(
      `https://img.vietqr.io/image/${BANK_CONFIG.BANK_BIN}-${BANK_CONFIG.ACCOUNT_NUMBER}-compact2.png`
    );
    qrUrl.searchParams.set('amount', amount.toString());
    qrUrl.searchParams.set('addInfo', content);
    qrUrl.searchParams.set('accountName', BANK_CONFIG.ACCOUNT_NAME);

    return {
      qrUrl: qrUrl.toString(),
      orderCode,
      amount,
      bankInfo: {
        bankName: BANK_CONFIG.BANK_NAME,
        accountNumber: BANK_CONFIG.ACCOUNT_NUMBER,
        accountName: BANK_CONFIG.ACCOUNT_NAME,
        content: content, // Trả về nội dung đầy đủ để hiển thị payment info
      },
    };
  },

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
  async handleWebhook(payload: SePayWebhookPayload): Promise<WebhookResult> {
    // 1. Chỉ xử lý tiền VÀO
    if (payload.transferType !== 'in') {
      return { success: false, message: 'Ignored: not incoming transfer' };
    }

    // 2. Kiểm tra đã xử lý giao dịch này chưa (tránh duplicate)
    const existingTransaction = await prisma.transaction.findFirst({
      where: { transactionCode: payload.referenceCode },
    });

    if (existingTransaction) {
      return { success: false, message: 'Transaction already processed' };
    }

    // 3. Parse mã đơn hàng từ nội dung chuyển khoản
    // Tìm pattern: DH + 8 ký tự (case insensitive)
    let order: any = null;
    const orderCodeMatch = payload.content.toUpperCase().match(/DH([A-Z0-9]{8})/);
    
    if (orderCodeMatch) {
      const orderCodeSuffix = orderCodeMatch[1]; // 8 ký tự cuối
      // 4a. Tìm đơn hàng có ID kết thúc bằng suffix này (Ưu tiên 1)
      order = await prisma.order.findFirst({
        where: {
          id: { endsWith: orderCodeSuffix.toLowerCase() },
          paymentStatus: 'UNPAID',
        },
      });
    }

    // 4b. FALLBACK: Nếu không tìm thấy bằng code, thử tìm bằng số tiền (Ưu tiên 2)
    // Chỉ áp dụng nếu số tiền > 0 và chỉ có DUY NHẤT 1 đơn hàng khớp số tiền
    if (!order) {
      console.log('[SePay] Code matching failed. Trying fallback by amount:', payload.transferAmount);
      
      const potentialOrders = await prisma.order.findMany({
        where: {
          totalMoney: payload.transferAmount,
          paymentStatus: 'UNPAID',
        },
      });

      if (potentialOrders.length === 1) {
        order = potentialOrders[0];
        console.log('[SePay] Fallback success! Matched order by exact amount:', order.id);
      } else if (potentialOrders.length > 1) {
        console.warn(`[SePay] Ambiguous amount match: Found ${potentialOrders.length} orders with amount ${payload.transferAmount}`);
        // Không dám auto-confirm nếu có nhiều đơn cùng số tiền
      }
    }

    if (!order) {
      console.log('[SePay] Order not found for content:', payload.content);
      return { success: false, message: 'Order not found or match ambiguous' };
    }

    // 5. Verify số tiền (cho phép sai lệch 1000đ do làm tròn)
    const expectedAmount = Number(order.totalMoney);
    const receivedAmount = payload.transferAmount;
    
    if (Math.abs(expectedAmount - receivedAmount) > 1000) {
      console.log('[SePay] Amount mismatch:', { expected: expectedAmount, received: receivedAmount });
      return { 
        success: false, 
        message: `Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}` 
      };
    }

    // 6. UPDATE: Đánh dấu đơn hàng đã thanh toán
    await prisma.$transaction([
      // Update order payment status
      prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PAID' },
      }),

      // Create transaction record
      prisma.transaction.create({
        data: {
          orderId: order.id,
          paymentMethod: 'SEPAY',
          transactionCode: payload.referenceCode,
          amount: receivedAmount,
          status: 'SUCCESS',
          description: `SePay: ${payload.gateway} - ${payload.content}`,
        },
      }),
    ]);

    console.log('[SePay] Payment confirmed for order:', order.id);

    return {
      success: true,
      orderId: order.id,
      message: 'Payment confirmed successfully',
    };
  },

  /**
   * =========================================================================
   * GET PAYMENT STATUS
   * =========================================================================
   * 
   * Lấy trạng thái thanh toán của đơn hàng (cho frontend polling)
   */
  async getPaymentStatus(orderId: string): Promise<{
    orderId: string;
    paymentStatus: PaymentStatus;
    paidAt?: Date;
  }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        paymentStatus: true,
        transactions: {
          where: { status: 'SUCCESS' },
          select: { paidAt: true },
          take: 1,
        },
      },
    });

    if (!order) {
      throw new Error('Đơn hàng không tồn tại');
    }

    return {
      orderId: order.id,
      paymentStatus: order.paymentStatus,
      paidAt: order.transactions[0]?.paidAt,
    };
  },

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
  verifySignature(signature: string, payload: string): boolean {
    const secret = process.env.SEPAY_WEBHOOK_SECRET;
    
    if (!secret) {
      // Không cấu hình secret → skip verification (dev mode)
      console.warn('[SePay] SEPAY_WEBHOOK_SECRET not configured, skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  },

  /**
   * =========================================================================
   * GET TRANSACTIONS (Admin)
   * =========================================================================
   */
  async getTransactions(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        skip,
        take: limit,
        orderBy: { paidAt: 'desc' },
        include: {
          order: {
            select: {
              id: true,
              totalMoney: true,
              status: true,
              // fullName: true, // Note: fullName might not be directly on Order depending on schema updates, using user relation if needed or just id
              user: {
                 select: { fullName: true, email: true }
              }
            }
          }
        }
      }),
      prisma.transaction.count()
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * =========================================================================
   * GET SEPAY TRANSACTION HISTORY (Admin - Xem lịch sử giao dịch)
   * =========================================================================
   * 
   * Lấy lịch sử giao dịch trực tiếp từ SePay API để hiển thị trong admin dashboard
   * Không sync vào database, chỉ để đối soát
   */
  async getSePayHistory(limit = 50) {
    try {
      const { SEPAY_API_TOKEN, BANK_ACCOUNT_NUMBER, SEPAY_API_URL } = process.env;
      
      if (!SEPAY_API_TOKEN || !BANK_ACCOUNT_NUMBER) {
        throw new Error('Missing SEPAY_API_TOKEN or BANK_ACCOUNT_NUMBER');
      }

      const apiUrl = SEPAY_API_URL || 'https://my.sepay.vn/userapi/transactions/list';

      // Fetch from SePay API
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          account_number: BANK_ACCOUNT_NUMBER,
          limit: limit
        }
      });

      // Transform to a cleaner format for frontend
      const transactions = response.data.transactions?.map((trans: any) => ({
        id: trans.id,
        transactionDate: trans.transaction_date,
        bankBrand: trans.bank_brand_name,
        accountNumber: trans.account_number,
        amountIn: Number(trans.amount_in || 0),
        amountOut: Number(trans.amount_out || 0),
        accumulated: Number(trans.accumulated || 0),
        content: trans.transaction_content,
        referenceNumber: trans.reference_number,
        description: trans.description || trans.transaction_content,
      })) || [];

      return {
        success: true,
        data: transactions,
        total: transactions.length,
        bankAccount: BANK_ACCOUNT_NUMBER,
      };

    } catch (error: any) {
      console.error('[SePay History Error]', error.message);
      throw new Error(`Failed to fetch SePay history: ${error.message}`);
    }
  },

  /**
   * =========================================================================
   * SYNC TRANSACTIONS FROM SEPAY (Manual Trigger)
   * =========================================================================
   */
  async syncBankTransactions(limit = 20) {
    try {
      const { SEPAY_API_TOKEN, BANK_ACCOUNT_NUMBER, SEPAY_API_URL } = process.env;
      
      if (!SEPAY_API_TOKEN || !BANK_ACCOUNT_NUMBER) {
        throw new Error('Missing SEPAY_API_TOKEN or BANK_ACCOUNT_NUMBER');
      }

      const apiUrl = SEPAY_API_URL || 'https://my.sepay.vn/userapi/transactions/list';

      // 1. Fetch from SePay
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${SEPAY_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        params: {
          account_number: BANK_ACCOUNT_NUMBER,
          limit: limit
        }
      });

      const transactions = response.data.transactions;
      let processedCount = 0;
      let errors = [];

      // 2. Process each transaction (Reuse webhook logic)
      for (const trans of transactions) {
        try {
          // Map API response to Webhook payload format
          const payload: SePayWebhookPayload = {
            id: trans.id,
            gateway: trans.bank_brand_name,
            transactionDate: trans.transaction_date,
            accountNumber: trans.account_number,
            subAccount: null,
            transferType: trans.transfer_type || 'in', // Default to 'in'
            transferAmount: Number(trans.amount_in || 0),
            accumulated: Number(trans.accumulated || 0),
            code: null,
            content: trans.transaction_content,
            referenceCode: trans.reference_number,
            description: trans.transaction_content
          };
          
          // Only process incoming transfers
          if (Number(trans.amount_in) > 0) {
             const result = await this.handleWebhook(payload);
             if (result.success) {
               processedCount++;
             }
          }
        } catch (err: any) {
          errors.push({ id: trans.id, error: err.message });
        }
      }

      return {
        success: true,
        message: `Synced ${transactions.length} transactions. Successfully processed ${processedCount} new payments.`,
        details: {
          fetched: transactions.length,
          processed: processedCount,
          errors
        }
      };

    } catch (error: any) {
      console.error('[SePay Sync Error]', error.message);
      throw new Error(`Failed to sync transactions: ${error.message}`);
    }
  },

  /**
   * =========================================================================
   * CREATE TEST ORDER (Development only)
   * =========================================================================
   * 
   * Tạo đơn hàng test với số tiền cố định 5000đ để test thanh toán
   * Trả về luôn QR code để scan
   */
  async createTestOrder(userId: string) {
    // 1. Lấy 1 sản phẩm bất kỳ
    const product = await prisma.product.findFirst();
    if (!product) {
      throw new Error('No products available for test order');
    }

    // 2. Số tiền test: 5000đ
    const testAmount = 5000;

    // 3. Tạo đơn hàng test
    const order = await prisma.order.create({
      data: {
        userId,
        subtotal: testAmount,
        shippingFee: 0,
        discountAmount: 0,
        totalMoney: testAmount,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        shippingAddress: 'Test Address - Demo Payment',
        shippingPhone: '0901234567',
        note: `Test thanh toán ${testAmount.toLocaleString()}đ`,
        details: {
          create: {
            productId: product.id,
            price: testAmount,
            quantity: 1,
          }
        }
      }
    });

    console.log(`[Test Order] Created: ${order.id} - ${testAmount}đ`);

    // 4. Generate QR code
    const qrData = await this.generateQRCode(order.id);

    return {
      order: {
        id: order.id,
        amount: testAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
      },
      ...qrData
    };
  }
};
