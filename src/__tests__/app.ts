/**
 * =============================================================================
 * APP.TS - Express App cho Testing (Cập nhật với tất cả routes)
 * =============================================================================
 * 
 * File này tạo Express app riêng biệt cho integration tests
 * Không include database connection và server.listen()
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Import middleware và routes
import { errorHandler } from '../middleware/errorHandler.js';
import authRoutes from '../modules/auth/auth.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';
import productRoutes from '../modules/products/product.routes.js';

/**
 * Factory function tạo Express app cho testing
 * Mỗi test suite có thể tạo app riêng, tránh conflict
 */
export const createTestApp = () => {
  const app = express();

  // Middleware cơ bản
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoryRoutes);
  app.use('/api/products', productRoutes);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'OK' } });
  });

  // 404 Handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
    });
  });

  // Error Handler (phải đặt cuối cùng)
  app.use(errorHandler);

  return app;
};

export default createTestApp;
