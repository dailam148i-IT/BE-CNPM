/**
 * TEST PAYMENT FLOW - Tạo đơn test 5000đ và lấy QR
 * 
 * Chạy: npx tsx test-payment-flow.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('='.repeat(60));
  console.log('🧪 TEST PAYMENT FLOW - 5,000 VNĐ');
  console.log('='.repeat(60));

  // 1. Tìm đơn hàng UNPAID có sẵn hoặc tạo mới
  let order = await prisma.order.findFirst({
    where: { paymentStatus: 'UNPAID' },
    orderBy: { createdAt: 'desc' }
  });

  if (!order) {
    console.log('\n⚠️ Không có đơn UNPAID. Đang tạo đơn mới...');
    
    // Lấy admin user
    const adminUser = await prisma.user.findFirst();
    if (!adminUser) {
      console.error('❌ Không có user trong hệ thống!');
      return;
    }

    // Lấy product
    const product = await prisma.product.findFirst();
    if (!product) {
      console.error('❌ Không có sản phẩm!');
      return;
    }

    const testAmount = 5000;
    order = await prisma.order.create({
      data: {
        userId: adminUser.id,
        subtotal: testAmount,
        shippingFee: 0,
        discountAmount: 0,
        totalMoney: testAmount,
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        shippingAddress: 'Test Address',
        shippingPhone: '0901234567',
        note: 'Test 5000d',
        details: {
          create: {
            productId: product.id,
            price: testAmount,
            quantity: 1,
          }
        }
      }
    });
    console.log('✅ Đã tạo đơn mới!');
  }

  const amount = Number(order.totalMoney);
  console.log(`\n📦 Order ID: ${order.id}`);
  console.log(`💰 Số tiền: ${amount.toLocaleString()} VNĐ`);

  // 2. Tạo mã đơn hàng (8 ký tự cuối của ID)
  const orderCode = `DH${order.id.slice(-8).toUpperCase()}`;
  
  // 3. Tạo URL QR VietQR
  const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER || '103881422328';
  const BANK_ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME || 'NGUYEN DAI LAM';
  const bankBin = '970415'; // VietinBank
  const template = 'compact2';
  
  const qrUrl = `https://img.vietqr.io/image/${bankBin}-${BANK_ACCOUNT_NUMBER}-${template}.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME)}`;

  console.log('\n' + '='.repeat(60));
  console.log('📱 THÔNG TIN THANH TOÁN');
  console.log('='.repeat(60));
  console.log(`\n🏦 Ngân hàng: VietinBank`);
  console.log(`📝 Số TK: ${BANK_ACCOUNT_NUMBER}`);
  console.log(`👤 Chủ TK: ${BANK_ACCOUNT_NAME}`);
  console.log(`💵 Số tiền: ${amount.toLocaleString()} VNĐ`);
  console.log(`📋 Nội dung CK: ${orderCode}`);
  
  console.log('\n' + '-'.repeat(60));
  console.log('🔗 COPY LINK NÀY VÀ PASTE VÀO TRÌNH DUYỆT:');
  console.log('\n' + qrUrl);
  
  console.log('\n' + '-'.repeat(60));
  console.log('🌐 Hoặc test trên Frontend:');
  console.log(`http://localhost:3000/checkout/test`);
  console.log(`→ Nhập Order ID: ${order.id}`);
  
  console.log('\n' + '='.repeat(60));
  console.log('⏳ Sau khi chuyển khoản, SePay sẽ gọi Webhook cập nhật!');
  console.log('='.repeat(60));

  await prisma.$disconnect();
}

main().catch(console.error);
