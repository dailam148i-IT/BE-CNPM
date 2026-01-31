/**
 * =============================================================================
 * PRODUCT.INTEGRATION.TEST.TS - Integration Tests với Database Thật
 * =============================================================================
 * 
 * Test Products API với database thật:
 * - Kết nối Oracle/MySQL test database
 * - Thao tác CRUD thật sự
 * - Verify data trong database
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import real routes (không mock)
import productRoutes from '../../modules/products/product.routes.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { prisma, createTestToken, createTestProduct, testIds } from './setup.js';

// Tạo test app
const app = express();
app.use(express.json());
app.use('/api/products', productRoutes);
app.use(errorHandler);

let adminToken: string;
let testCategoryId: string;

beforeAll(async () => {
  adminToken = await createTestToken('ADMIN');
  
  // Lấy test category ID từ seed
  const testCategory = await prisma.category.findUnique({
    where: { slug: 'test-category' },
  });
  testCategoryId = testCategory?.id || '';
});

describe('Product Integration Tests', () => {
  // ===========================================================================
  // GET /api/products
  // ===========================================================================
  describe('GET /api/products', () => {
    it('should return products from real database', async () => {
      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toBeDefined();
      
      // Verify có ít nhất test product từ seed
      const testProduct = res.body.data.products.find(
        (p: any) => p.slug === 'test-product'
      );
      expect(testProduct).toBeDefined();
    });

    it('should filter by categoryId', async () => {
      const res = await request(app).get(`/api/products?categoryId=${testCategoryId}`);

      expect(res.status).toBe(200);
      res.body.data.products.forEach((prod: any) => {
        expect(prod.categoryId).toBe(testCategoryId);
      });
    });

    it('should filter by price range', async () => {
      const res = await request(app).get('/api/products?minPrice=50000&maxPrice=150000');

      expect(res.status).toBe(200);
      res.body.data.products.forEach((prod: any) => {
        expect(prod.price).toBeGreaterThanOrEqual(50000);
        expect(prod.price).toBeLessThanOrEqual(150000);
      });
    });

    it('should paginate results', async () => {
      const res = await request(app).get('/api/products?page=1&limit=5');

      expect(res.status).toBe(200);
      expect(res.body.data.products.length).toBeLessThanOrEqual(5);
      expect(res.body.data.pagination.page).toBe(1);
      expect(res.body.data.pagination.limit).toBe(5);
    });

    it('should sort by price ascending', async () => {
      const res = await request(app).get('/api/products?sortBy=price&sortOrder=asc');

      expect(res.status).toBe(200);
      const prices = res.body.data.products.map((p: any) => p.price);
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
    });
  });

  // ===========================================================================
  // GET /api/products/detail/:slug
  // ===========================================================================
  describe('GET /api/products/detail/:slug', () => {
    it('should return product detail by slug', async () => {
      const res = await request(app).get('/api/products/detail/test-product');

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('test-product');
      expect(res.body.data.name).toBe('Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app).get('/api/products/detail/non-existent-product');

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /api/products (Admin)
  // ===========================================================================
  describe('POST /api/products', () => {
    it('should create product in real database', async () => {
      const newProduct = {
        name: 'Integration Test Product',
        description: 'Created during integration test',
        price: 250000,
        stockQuantity: 30,
        categoryId: testCategoryId,
        status: 'PUBLISHED',
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Integration Test Product');
      expect(res.body.data.slug).toBe('integration-test-product');

      // Track for cleanup
      testIds.products.push(res.body.data.id);

      // Verify trong database
      const dbProduct = await prisma.product.findUnique({
        where: { id: res.body.data.id },
      });
      expect(dbProduct).not.toBeNull();
      expect(dbProduct?.name).toBe('Integration Test Product');
      expect(dbProduct?.price).toBe(250000);
    });

    it('should reject duplicate slug', async () => {
      const duplicateProduct = {
        name: 'Test Product', // Slug sẽ trùng với seeded product
        price: 100000,
        categoryId: testCategoryId,
        status: 'DRAFT',
        stockQuantity: 10,
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateProduct);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Slug đã tồn tại');
    });

    it('should reject with invalid categoryId', async () => {
      const invalidProduct = {
        name: 'Invalid Category Product',
        price: 100000,
        categoryId: 'non-existent-category-id',
        status: 'DRAFT',
        stockQuantity: 10,
      };

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProduct);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('Danh mục');
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'No Auth Product', price: 100000 });

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // PUT /api/products/:id (Admin)
  // ===========================================================================
  describe('PUT /api/products/:id', () => {
    it('should update product in database', async () => {
      // Tạo product để update
      const newProd = await createTestProduct({
        name: 'To Update Product',
        price: 100000,
        categoryId: testCategoryId,
      });

      const res = await request(app)
        .put(`/api/products/${newProd.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product Name',
          price: 200000,
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Product Name');

      // Verify trong database
      const dbProduct = await prisma.product.findUnique({
        where: { id: newProd.id },
      });
      expect(dbProduct?.name).toBe('Updated Product Name');
      expect(dbProduct?.price).toBe(200000);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await request(app)
        .put('/api/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // DELETE /api/products/:id (Admin)
  // ===========================================================================
  describe('DELETE /api/products/:id', () => {
    it('should delete product from database', async () => {
      // Tạo product để delete
      const newProd = await createTestProduct({
        name: 'To Delete Product',
        price: 50000,
        categoryId: testCategoryId,
      });

      const res = await request(app)
        .delete(`/api/products/${newProd.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify đã xóa khỏi database
      const dbProduct = await prisma.product.findUnique({
        where: { id: newProd.id },
      });
      expect(dbProduct).toBeNull();

      // Remove from testIds vì đã xóa
      const idx = testIds.products.indexOf(newProd.id);
      if (idx > -1) testIds.products.splice(idx, 1);
    });
  });
});
