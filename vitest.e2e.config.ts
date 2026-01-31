/**
 * =============================================================================
 * VITEST.E2E.CONFIG.TS - Config cho E2E Tests với Test Database
 * =============================================================================
 * 
 * E2E Tests chạy trực tiếp trên test database (mysql://root:@localhost:3306/test)
 * 
 * Chạy: npm run test:e2e
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Thư mục chứa E2E tests
    include: ['src/__tests__/e2e/**/*.test.ts'],

    // Chạy tuần tự
    sequence: {
      concurrent: false,
    },

    // Timeout cao hơn cho database operations
    testTimeout: 30000,

    // Globals
    globals: true,

    // Environment variables cho test
    env: {
      DATABASE_URL: 'mysql://root:@localhost:3306/test',
      NODE_ENV: 'test',
    },
  },
});
