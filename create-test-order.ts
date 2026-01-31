
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CREATING TEST ORDER ---');
  
  // 1. Create a dummy user if not exists (optional, or attach to existing)
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found, cannot create order. Please check DB seeding or register a user first.');
    return;
  }

  // 2. Create a UNPAID order
  const newOrder = await prisma.order.create({
    data: {
      userId: user.id,
      totalMoney: 150000,
      subtotal: 150000,
      status: 'PENDING',
      paymentStatus: 'UNPAID',
      shippingAddress: '123 Test Street, Developer City',
      shippingPhone: '0909090909',
      // Note: paymentMethod is stored in Transaction, not directly in Order in this schema version
    }
  });

  const orderCode = `DH${newOrder.id.slice(-8).toUpperCase()}`;
  console.log(`Created Order ID: ${newOrder.id}`);
  console.log(`Order Code (for SePay content): ${orderCode}`);

  console.log('\n--- SIMULATING SEPAY WEBHOOK ---');
  console.log(`Run this curl command in another terminal to test success flow:`);
  
  const webhookBody = {
    id: Math.floor(Math.random() * 1000000),
    gateway: 'VietinBank',
    transactionDate: new Date().toISOString(),
    accountNumber: '103881422328',
    subAccount: null,
    transferType: 'in',
    transferAmount: 150000,
    accumulated: 1500000,
    code: null,
    content: `${orderCode} thanh toan don hang`, 
    referenceCode: `FT${Date.now()}`,
    description: 'Test payment'
  };
  
  // Escape JSON for Windows PowerShell curl (double quotes escaped)
  const jsonBody = JSON.stringify(webhookBody).replace(/"/g, '\\"');

  console.log(`\ncurl -X POST "https://magnus-lineable-maybell.ngrok-free.dev/api/payment/sepay-webhook" -H "Content-Type: application/json" -H "Authorization: Apikey 4hdbshbwhue72eudbchsdbc823e2736fchsc7sdb7w" -d "${jsonBody}"`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
