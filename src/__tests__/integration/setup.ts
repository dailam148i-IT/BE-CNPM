/**
 * =============================================================================
 * INTEGRATION TEST SETUP - Kết nối Database Thật
 * =============================================================================
 * 
 * File này setup cho integration tests với database thật:
 * 1. Load .env.test
 * 2. Kết nối Prisma với test database
 * 3. Seed test data trước khi test
 * 4. Cleanup sau khi test
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Prisma client kết nối với test database
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Test data IDs để cleanup
export const testIds = {
  users: [] as string[],
  categories: [] as string[],
  products: [] as string[],
};

/**
 * BEFORE ALL TESTS
 * - Kết nối database
 * - Tạo test data cơ bản
 */
beforeAll(async () => {
  console.log('🔌 Connecting to test database...');
  await prisma.$connect();
  console.log('✅ Connected to test database');
  
  // Seed basic test data
  await seedTestData();
});

/**
 * AFTER ALL TESTS
 * - Cleanup test data
 * - Đóng kết nối
 */
afterAll(async () => {
  console.log('🧹 Cleaning up test data...');
  await cleanupTestData();
  
  await prisma.$disconnect();
  console.log('🔌 Disconnected from test database');
});

/**
 * BEFORE EACH TEST
 * - Reset state nếu cần
 */
beforeEach(async () => {
  // Reset specific tables if needed
});

// =============================================================================
// SEED TEST DATA
// =============================================================================
async function seedTestData() {
  try {
    // Tạo test role nếu chưa có
    const adminRole = await prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'Administrator',
      },
    });

    const userRole = await prisma.role.upsert({
      where: { name: 'USER' },
      update: {},
      create: {
        name: 'USER',
        description: 'Regular User',
      },
    });

    // Tạo test admin user
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash('test123456', 10);

    const testAdmin = await prisma.user.upsert({
      where: { email: 'test-admin@test.com' },
      update: {},
      create: {
        username: 'test_admin',
        email: 'test-admin@test.com',
        passwordHash: hashedPassword,
        fullName: 'Test Admin',
        roleId: adminRole.id,
        status: 'ACTIVE',
      },
    });
    testIds.users.push(testAdmin.id);

    // Tạo test categories
    const testCategory = await prisma.category.upsert({
      where: { slug: 'test-category' },
      update: {},
      create: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Category for integration tests',
        type: 'PRODUCT',
        isActive: true,
      },
    });
    testIds.categories.push(testCategory.id);

    // Tạo test product
    const testProduct = await prisma.product.upsert({
      where: { slug: 'test-product' },
      update: {},
      create: {
        name: 'Test Product',
        slug: 'test-product',
        description: 'Product for integration tests',
        price: 100000,
        stockQuantity: 50,
        status: 'PUBLISHED',
        categoryId: testCategory.id,
      },
    });
    testIds.products.push(testProduct.id);

    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

// =============================================================================
// CLEANUP TEST DATA
// =============================================================================
async function cleanupTestData() {
  try {
    // Xóa products được tạo trong tests
    if (testIds.products.length > 0) {
      await prisma.product.deleteMany({
        where: { id: { in: testIds.products } },
      });
    }

    // Xóa categories được tạo trong tests
    if (testIds.categories.length > 0) {
      await prisma.category.deleteMany({
        where: { id: { in: testIds.categories } },
      });
    }

    // Xóa users được tạo trong tests
    if (testIds.users.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: testIds.users } },
      });
    }

    console.log('✅ Test data cleaned up');
  } catch (error) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

// =============================================================================
// HELPER FUNCTIONS FOR TESTS
// =============================================================================

/**
 * Tạo JWT token cho test user
 */
export async function createTestToken(role: 'ADMIN' | 'USER' = 'ADMIN'): Promise<string> {
  const jwt = await import('jsonwebtoken');
  
  const user = await prisma.user.findFirst({
    where: { email: 'test-admin@test.com' },
    include: { role: true },
  });

  if (!user) throw new Error('Test user not found');

  return jwt.sign(
    { userId: user.id, role: user.role.name },
    process.env.ACCESS_TOKEN_SECRET || 'test-secret',
    { expiresIn: '15m' }
  );
}

/**
 * Tạo category mới cho test
 */
export async function createTestCategory(data: {
  name: string;
  slug?: string;
}): Promise<{ id: string; name: string; slug: string }> {
  const category = await prisma.category.create({
    data: {
      name: data.name,
      slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
      type: 'PRODUCT',
      isActive: true,
    },
  });
  testIds.categories.push(category.id);
  return category;
}

/**
 * Tạo product mới cho test
 */
export async function createTestProduct(data: {
  name: string;
  price: number;
  categoryId: string;
}): Promise<{ id: string; name: string; slug: string }> {
  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug: data.name.toLowerCase().replace(/\s+/g, '-'),
      price: data.price,
      stockQuantity: 10,
      status: 'PUBLISHED',
      categoryId: data.categoryId,
    },
  });
  testIds.products.push(product.id);
  return product;
}
