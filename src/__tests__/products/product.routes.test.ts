/**
 * =============================================================================
 * PRODUCT.ROUTES.TEST.TS - Integration Tests cho Product API
 * =============================================================================
 * 
 * Test các endpoints:
 * GET    /api/products             - Lấy danh sách products (published)
 * GET    /api/products/detail/:slug- Lấy product theo slug
 * GET    /api/products/admin       - Lấy tất cả products (Admin)
 * GET    /api/products/admin/:id   - Lấy product by ID (Admin)
 * POST   /api/products             - Tạo product (Admin)
 * PUT    /api/products/:id         - Cập nhật product (Admin)
 * DELETE /api/products/:id         - Xóa product (Admin)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../app.js';
import prisma from '../../config/database.js';
import jwt from 'jsonwebtoken';

// Import setup để mock Prisma
import '../setup.js';

const app = createTestApp();

// Mock data
const mockProducts = [
  {
    id: 'prod-1',
    name: 'Trà Ô Long Cao Cấp',
    slug: 'tra-o-long-cao-cap',
    description: 'Trà ô long cao cấp nhập khẩu',
    shortDesc: 'Trà ô long',
    price: 150000,
    stockQuantity: 100,
    sku: 'TOL-001',
    status: 'PUBLISHED',
    categoryId: 'cat-1',
    category: { id: 'cat-1', name: 'Trà Ô Long', slug: 'tra-o-long' },
    images: [{ id: 'img-1', url: 'http://example.com/img.jpg', isThumbnail: true }],
    _count: { reviews: 5 },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockAdminUser = {
  id: 'admin-user-id',
  username: 'admin',
  role: { name: 'ADMIN' },
};

// Helper: Tạo JWT token cho admin
const createAdminToken = () => {
  return jwt.sign(
    { userId: 'admin-user-id', role: 'ADMIN' },
    process.env.ACCESS_TOKEN_SECRET!,
    { expiresIn: '15m' }
  );
};

describe('Product Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // GET /api/products
  // ===========================================================================
  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);
      vi.mocked(prisma.review.aggregate).mockResolvedValue({ _avg: { rating: 4.5 } } as any);

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.products).toBeInstanceOf(Array);
      expect(res.body.data.pagination).toBeDefined();
    });

    it('should filter by categoryId', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const res = await request(app).get('/api/products?categoryId=cat-1');

      expect(res.status).toBe(200);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        })
      );
    });

    it('should filter by price range', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const res = await request(app).get('/api/products?minPrice=100000&maxPrice=200000');

      expect(res.status).toBe(200);
    });

    it('should search by name', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const res = await request(app).get('/api/products?search=ô+long');

      expect(res.status).toBe(200);
    });

    it('should sort by price ascending', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      const res = await request(app).get('/api/products?sortBy=price&sortOrder=asc');

      expect(res.status).toBe(200);
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        })
      );
    });
  });

  // ===========================================================================
  // GET /api/products/detail/:slug
  // ===========================================================================
  describe('GET /api/products/detail/:slug', () => {
    it('should return product by slug', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProducts[0],
        reviews: [],
      } as any);
      vi.mocked(prisma.review.aggregate).mockResolvedValue({ _avg: { rating: 4.5 } } as any);
      vi.mocked(prisma.review.count).mockResolvedValue(5);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]); // Related products

      const res = await request(app).get('/api/products/detail/tra-o-long-cao-cap');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.slug).toBe('tra-o-long-cao-cap');
    });

    it('should return 404 if product not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const res = await request(app).get('/api/products/detail/not-exist');

      expect(res.status).toBe(404);
    });

    it('should return 404 if product not published', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProducts[0],
        status: 'DRAFT',
      } as any);

      const res = await request(app).get('/api/products/detail/draft-product');

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // GET /api/products/admin (Admin Only)
  // ===========================================================================
  describe('GET /api/products/admin', () => {
    it('should return all products for admin', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.product.findMany).mockResolvedValue(mockProducts as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);

      const res = await request(app)
        .get('/api/products/admin')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/products/admin');

      expect(res.status).toBe(401);
    });
  });

  // ===========================================================================
  // POST /api/products (Admin Only)
  // ===========================================================================
  describe('POST /api/products', () => {
    it('should create product with valid data', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1', name: 'Trà' } as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null); // Slug not exists
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            create: vi.fn().mockResolvedValue(mockProducts[0]),
          },
          productImage: {
            createMany: vi.fn(),
          },
        });
      });

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Trà Ô Long Cao Cấp',
          price: 150000,
          categoryId: 'cat-1',
          description: 'Mô tả sản phẩm',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/products')
        .send({ name: 'Test' });

      expect(res.status).toBe(401);
    });

    it('should return 422 with invalid data', async () => {
      const token = createAdminToken();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'a', // Too short
          price: -100, // Negative
        });

      expect(res.status).toBe(422);
    });

    it('should return 404 if category not exists', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Trà Mới',
          price: 100000,
          categoryId: 'not-exist',
        });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // PUT /api/products/:id (Admin Only)
  // ===========================================================================
  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProducts[0] as any);
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null); // No duplicate slug
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            update: vi.fn().mockResolvedValue({
              ...mockProducts[0],
              name: 'Updated Name',
            }),
          },
          productImage: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
        });
      });

      const res = await request(app)
        .put('/api/products/prod-1')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if product not found', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/products/not-exist')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // DELETE /api/products/:id (Admin Only)
  // ===========================================================================
  describe('DELETE /api/products/:id', () => {
    it('should soft delete product with orders', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProducts[0],
        _count: { orderItems: 5 },
      } as any);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProducts[0],
        status: 'DISCONTINUED',
      } as any);

      const res = await request(app)
        .delete('/api/products/prod-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Đã ẩn');
    });

    it('should hard delete product without orders', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProducts[0],
        _count: { orderItems: 0 },
      } as any);
      vi.mocked(prisma.product.delete).mockResolvedValue(mockProducts[0] as any);

      const res = await request(app)
        .delete('/api/products/prod-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Xóa');
    });

    it('should return 404 if product not found', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/products/not-exist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
