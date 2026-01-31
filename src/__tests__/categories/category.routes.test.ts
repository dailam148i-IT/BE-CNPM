/**
 * =============================================================================
 * CATEGORY.ROUTES.TEST.TS - Integration Tests cho Category API
 * =============================================================================
 * 
 * Test các endpoints:
 * GET    /api/categories        - Lấy danh sách categories
 * GET    /api/categories/tree   - Lấy category tree
 * GET    /api/categories/:slug  - Lấy category theo slug
 * POST   /api/categories        - Tạo category (Admin)
 * PUT    /api/categories/:id    - Cập nhật category (Admin)
 * DELETE /api/categories/:id    - Xóa category (Admin)
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
const mockCategories = [
  {
    id: 'cml0ojfcl000379jwugrym1n6',
    name: 'Trà Ô Long',
    slug: 'tra-o-long',
    description: 'Trà Ô Long cao cấp',
    parentId: null,
    isActive: true,
    type: 'PRODUCT',
    parent: null,
    children: [],
    _count: { products: 5, news: 0 },
  },
  {
    id: 'cml0ojfcl000479jw2ifhrtv5',
    name: 'Trà Xanh',
    slug: 'tra-xanh',
    description: 'Trà xanh tự nhiên',
    parentId: null,
    isActive: true,
    type: 'PRODUCT',
    parent: null,
    children: [],
    _count: { products: 3, news: 0 },
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

describe('Category Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // GET /api/categories
  // ===========================================================================
  describe('GET /api/categories', () => {
    it('should return list of categories', async () => {
      // Mock Prisma response
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as any);

      const res = await request(app).get('/api/categories');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter categories by type', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as any);

      const res = await request(app).get('/api/categories?type=PRODUCT');

      expect(res.status).toBe(200);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'PRODUCT' }),
        })
      );
    });

    it('should filter categories by isActive', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as any);

      const res = await request(app).get('/api/categories?isActive=true');

      expect(res.status).toBe(200);
    });
  });

  // ===========================================================================
  // GET /api/categories/tree
  // ===========================================================================
  describe('GET /api/categories/tree', () => {
    it('should return category tree structure', async () => {
      const mockTree = [
        {
          ...mockCategories[0],
          children: [
            { id: 'child-1', name: 'Ô Long Sữa', slug: 'o-long-sua', children: [] },
          ],
        },
      ];

      vi.mocked(prisma.category.findMany).mockResolvedValue(mockTree as any);

      const res = await request(app).get('/api/categories/tree');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should filter tree by type', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);

      const res = await request(app).get('/api/categories/tree?type=NEWS');

      expect(res.status).toBe(200);
    });
  });

  // ===========================================================================
  // GET /api/categories/:slug
  // ===========================================================================
  describe('GET /api/categories/:slug', () => {
    it('should return category by slug', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategories[0],
        products: [],
      } as any);

      const res = await request(app).get('/api/categories/tra-o-long');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.slug).toBe('tra-o-long');
    });

    it('should return 404 if category not found', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      const res = await request(app).get('/api/categories/not-exist');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ===========================================================================
  // POST /api/categories (Admin Only)
  // ===========================================================================
  describe('POST /api/categories', () => {
    it('should create category with valid data', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null); // Slug not exists
      vi.mocked(prisma.category.create).mockResolvedValue({
        id: 'new-category-id',
        name: 'Trà Hồng',
        slug: 'tra-hong',
        description: 'Trà hồng thơm ngon',
        parentId: null,
        isActive: true,
        type: 'PRODUCT',
      } as any);

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Trà Hồng',
          description: 'Trà hồng thơm ngon',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Trà Hồng');
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/categories')
        .send({ name: 'Test' });

      expect(res.status).toBe(401);
    });

    it('should return 422 with invalid data', async () => {
      const token = createAdminToken();
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'a' }); // Too short

      expect(res.status).toBe(422);
    });

    it('should return 400 if slug already exists', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategories[0] as any);

      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Trà Ô Long' });

      expect(res.status).toBe(400);
    });
  });

  // ===========================================================================
  // PUT /api/categories/:id (Admin Only)
  // ===========================================================================
  describe('PUT /api/categories/:id', () => {
    it('should update category', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategories[0] as any);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null); // No duplicate slug
      vi.mocked(prisma.category.update).mockResolvedValue({
        ...mockCategories[0],
        name: 'Trà Ô Long Premium',
        slug: 'tra-o-long-premium',
      } as any);

      const res = await request(app)
        .put('/api/categories/cml0ojfcl000379jwugrym1n6')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Trà Ô Long Premium' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 404 if category not found', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/categories/not-exist-id')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // DELETE /api/categories/:id (Admin Only)
  // ===========================================================================
  describe('DELETE /api/categories/:id', () => {
    it('should delete category without products or children', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategories[0],
        _count: { products: 0, children: 0 },
      } as any);
      vi.mocked(prisma.category.delete).mockResolvedValue(mockCategories[0] as any);

      const res = await request(app)
        .delete('/api/categories/cml0ojfcl000379jwugrym1n6')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if category has products', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategories[0],
        _count: { products: 5, children: 0 },
      } as any);

      const res = await request(app)
        .delete('/api/categories/cml0ojfcl000379jwugrym1n6')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });

    it('should return 400 if category has children', async () => {
      const token = createAdminToken();
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockAdminUser as any);
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategories[0],
        _count: { products: 0, children: 2 },
      } as any);

      const res = await request(app)
        .delete('/api/categories/cml0ojfcl000379jwugrym1n6')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });
});
