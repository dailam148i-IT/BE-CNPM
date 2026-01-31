/**
 * =============================================================================
 * CATEGORY.INTEGRATION.TEST.TS - Integration Tests với Database Thật
 * =============================================================================
 * 
 * Test Categories API với database thật:
 * - Kết nối Oracle/MySQL test database
 * - Thao tác CRUD thật sự
 * - Verify data trong database
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

// Import real routes (không mock)
import categoryRoutes from '../../modules/categories/category.routes.js';
import { errorHandler } from '../../middleware/errorHandler.js';
import { prisma, createTestToken, createTestCategory, testIds } from './setup.js';

// Tạo test app
const app = express();
app.use(express.json());
app.use('/api/categories', categoryRoutes);
app.use(errorHandler);

let adminToken: string;

beforeAll(async () => {
  adminToken = await createTestToken('ADMIN');
});

describe('Category Integration Tests', () => {
  // ===========================================================================
  // GET /api/categories
  // ===========================================================================
  describe('GET /api/categories', () => {
    it('should return categories from real database', async () => {
      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      
      // Verify có ít nhất test category từ seed
      const testCategory = res.body.data.find(
        (c: any) => c.slug === 'test-category'
      );
      expect(testCategory).toBeDefined();
      expect(testCategory.name).toBe('Test Category');
    });

    it('should filter by type', async () => {
      const res = await request(app).get('/api/categories?type=PRODUCT');

      expect(res.status).toBe(200);
      res.body.data.forEach((cat: any) => {
        expect(cat.type).toBe('PRODUCT');
      });
    });
  });

  // ===========================================================================
  // GET /api/categories/:slug
  // ===========================================================================
  describe('GET /api/categories/:slug', () => {
    it('should return category by slug', async () => {
      const res = await request(app).get('/api/categories/test-category');

      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe('test-category');
      expect(res.body.data.name).toBe('Test Category');
    });

    it('should return 404 for non-existent slug', async () => {
      const res = await request(app).get('/api/categories/non-existent-slug');

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // POST /api/categories (Admin)
  // ===========================================================================
  describe('POST /api/categories', () => {
    it('should create category in real database', async () => {
      const newCategory = {
        name: 'Integration Test Category',
        description: 'Created during integration test',
        type: 'PRODUCT',
      };

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Integration Test Category');
      expect(res.body.data.slug).toBe('integration-test-category');

      // Track for cleanup
      testIds.categories.push(res.body.data.id);

      // Verify trong database
      const dbCategory = await prisma.category.findUnique({
        where: { id: res.body.data.id },
      });
      expect(dbCategory).not.toBeNull();
      expect(dbCategory?.name).toBe('Integration Test Category');
    });

    it('should reject duplicate slug', async () => {
      const duplicateCategory = {
        name: 'Test Category', // Slug sẽ trùng với seeded category
        type: 'PRODUCT',
      };

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(duplicateCategory);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Slug đã tồn tại');
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'No Auth Category' });

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // PUT /api/categories/:id (Admin)
  // ===========================================================================
  describe('PUT /api/categories/:id', () => {
    it('should update category in database', async () => {
      // Tạo category để update
      const newCat = await createTestCategory({ name: 'To Update Category' });

      const res = await request(app)
        .put(`/api/categories/${newCat.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category Name',
          description: 'Updated description',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Category Name');

      // Verify trong database
      const dbCategory = await prisma.category.findUnique({
        where: { id: newCat.id },
      });
      expect(dbCategory?.name).toBe('Updated Category Name');
      expect(dbCategory?.description).toBe('Updated description');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await request(app)
        .put('/api/categories/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // DELETE /api/categories/:id (Admin)
  // ===========================================================================
  describe('DELETE /api/categories/:id', () => {
    it('should delete category from database', async () => {
      // Tạo category để delete
      const newCat = await createTestCategory({ name: 'To Delete Category' });

      const res = await request(app)
        .delete(`/api/categories/${newCat.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);

      // Verify đã xóa khỏi database
      const dbCategory = await prisma.category.findUnique({
        where: { id: newCat.id },
      });
      expect(dbCategory).toBeNull();

      // Remove from testIds vì đã xóa
      const idx = testIds.categories.indexOf(newCat.id);
      if (idx > -1) testIds.categories.splice(idx, 1);
    });

    it('should reject delete if category has products', async () => {
      // Test category từ seed có product attached
      const testCategory = await prisma.category.findUnique({
        where: { slug: 'test-category' },
      });

      if (testCategory) {
        const res = await request(app)
          .delete(`/api/categories/${testCategory.id}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('sản phẩm');
      }
    });
  });
});
