/**
 * =============================================================================
 * TEST SETUP - Cấu hình môi trường test (Cập nhật đầy đủ)
 * =============================================================================
 * 
 * File này được chạy trước mỗi test file
 * Thiết lập các mock và environment variables
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-key-for-testing';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-key-for-testing';

/**
 * Mock Prisma Client
 * 
 * Thay vì kết nối database thật, ta mock các methods
 * Mỗi test sẽ định nghĩa behavior cho mock
 */
vi.mock('../config/database.js', () => {
  return {
    default: {
      // User model
      user: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      // Role model
      role: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
      },
      // Session model
      session: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      // Category model
      category: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      // Product model
      product: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      // ProductImage model
      productImage: {
        findMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      // Review model
      review: {
        findMany: vi.fn(),
        aggregate: vi.fn(),
        count: vi.fn(),
      },
      // Transaction support
      $transaction: vi.fn((callback) => callback({
        product: {
          create: vi.fn(),
          update: vi.fn(),
          findUnique: vi.fn(),
        },
        productImage: {
          createMany: vi.fn(),
          deleteMany: vi.fn(),
        },
      })),
    },
  };
});

/**
 * Reset mocks sau mỗi test
 */
import { afterEach } from 'vitest';

afterEach(() => {
  vi.clearAllMocks();
});
