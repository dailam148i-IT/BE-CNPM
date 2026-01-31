/**
 * =============================================================================
 * VITEST.INTEGRATION.CONFIG.TS - Config cho Integration Tests
 * =============================================================================
 * 
 * Chạy integration tests với database thật:
 *   npm run test:integration
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Thư mục chứa integration tests
    include: ['src/__tests__/integration/**/*.test.ts'],
    
    // File setup cho integration tests
    setupFiles: ['src/__tests__/integration/setup.ts'],
    
    // Chạy tuần tự (không parallel) để tránh conflict database
    sequence: {
      concurrent: false,
    },
    
    // Timeout cao hơn vì có database operations
    testTimeout: 30000,
    
    // Globals
    globals: true,
  },
});
