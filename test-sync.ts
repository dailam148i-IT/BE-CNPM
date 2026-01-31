
import { paymentService } from './src/modules/payment/payment.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- TESTING SYNC TRANSACTIONS ---');
  try {
    const result = await paymentService.syncBankTransactions(5);
    console.log('Sync Result:', JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error('Sync Failed (Expected if API key invalid for this endpoint):', error.message);
  }
    
  console.log('\n--- CHECKING DB TRANSACTIONS ---');
  try {
    const dbTransactions = await paymentService.getTransactions(1, 5);
    console.log('DB Transactions:', JSON.stringify(dbTransactions, null, 2));
  } catch (error: any) {
    console.error('DB Check Failed:', error.message);
  }
}

main();
