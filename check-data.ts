
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- CHECKING TRANSACTIONS ---');
  const transactions = await prisma.transaction.findMany({
    orderBy: { paidAt: 'desc' },
    take: 5
  });
  console.log('Transactions found:', transactions.length);
  console.table(transactions);

  console.log('\n--- CHECKING ORDERS ---');
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.table(orders.map(o => ({ 
    id: o.id, 
    total: o.totalMoney, 
    status: o.status, 
    payment: o.paymentStatus 
  })));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
