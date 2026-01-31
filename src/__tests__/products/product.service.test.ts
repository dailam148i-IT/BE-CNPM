/**
 * =============================================================================
 * PRODUCT.SERVICE.TEST.TS - Unit Tests cho Product Service
 * =============================================================================
 * 
 * Test các business logic methods:
 * - findAll()      - Lấy danh sách + pagination
 * - findBySlug()   - Lấy chi tiết theo slug
 * - findById()     - Lấy theo ID (admin)
 * - create()       - Tạo mới
 * - update()       - Cập nhật
 * - delete()       - Xóa (soft/hard)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from '../../modules/products/product.service.js';
import prisma from '../../config/database.js';

// Import setup để mock Prisma
import '../setup.js';

// Mock data
const mockProduct = {
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
};

describe('Product Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // findAll
  // ===========================================================================
  describe('findAll()', () => {
    it('should return paginated products', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([mockProduct] as any);
      vi.mocked(prisma.product.count).mockResolvedValue(1);
      vi.mocked(prisma.review.aggregate).mockResolvedValue({ _avg: { rating: 4.5 } } as any);

      const result = await productService.findAll({});

      expect(result.products).toBeInstanceOf(Array);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by categoryId', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await productService.findAll({ categoryId: 'cat-1' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ categoryId: 'cat-1' }),
        })
      );
    });

    it('should filter by price range', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await productService.findAll({ minPrice: 100000, maxPrice: 200000 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            price: { gte: 100000, lte: 200000 },
          }),
        })
      );
    });

    it('should search by keyword', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await productService.findAll({ search: 'ô long' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.anything() }),
              expect.objectContaining({ description: expect.anything() }),
            ]),
          }),
        })
      );
    });

    it('should apply sorting', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(0);

      await productService.findAll({ sortBy: 'price', sortOrder: 'asc' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { price: 'asc' },
        })
      );
    });

    it('should apply pagination', async () => {
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);
      vi.mocked(prisma.product.count).mockResolvedValue(50);

      const result = await productService.findAll({ page: 2, limit: 12 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 12, // (page-1) * limit
          take: 12,
        })
      );
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.totalPages).toBe(5);
    });
  });

  // ===========================================================================
  // findBySlug
  // ===========================================================================
  describe('findBySlug()', () => {
    it('should return product detail by slug', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        reviews: [],
      } as any);
      vi.mocked(prisma.review.aggregate).mockResolvedValue({ _avg: { rating: 4.5 } } as any);
      vi.mocked(prisma.review.count).mockResolvedValue(5);
      vi.mocked(prisma.product.findMany).mockResolvedValue([]);

      const result = await productService.findBySlug('tra-o-long-cao-cap');

      expect(result.product.slug).toBe('tra-o-long-cao-cap');
      expect(result.rating).toBeDefined();
      expect(result.relatedProducts).toBeInstanceOf(Array);
    });

    it('should throw NotFoundError if not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(productService.findBySlug('not-exist')).rejects.toThrow(
        'Không tìm thấy sản phẩm'
      );
    });

    it('should throw NotFoundError if not published', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        status: 'DRAFT',
      } as any);

      await expect(productService.findBySlug('draft-product')).rejects.toThrow(
        'Không tìm thấy sản phẩm'
      );
    });
  });

  // ===========================================================================
  // findById
  // ===========================================================================
  describe('findById()', () => {
    it('should return product by ID', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.review.aggregate).mockResolvedValue({ _avg: { rating: 4.5 } } as any);

      const result = await productService.findById('prod-1');

      expect(result.id).toBe('prod-1');
    });

    it('should throw NotFoundError if not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(productService.findById('not-exist')).rejects.toThrow(
        'Không tìm thấy sản phẩm'
      );
    });
  });

  // ===========================================================================
  // create
  // ===========================================================================
  describe('create()', () => {
    it('should create product with valid data', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            create: vi.fn().mockResolvedValue(mockProduct),
          },
          productImage: {
            createMany: vi.fn(),
          },
        });
      });

      const result = await productService.create({
        name: 'Trà Ô Long Cao Cấp',
        price: 150000,
        categoryId: 'cat-1',
      });

      expect(result.name).toBe('Trà Ô Long Cao Cấp');
    });

    it('should throw NotFoundError if category not exists', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(
        productService.create({
          name: 'Test',
          price: 100000,
          categoryId: 'not-exist',
        })
      ).rejects.toThrow('Danh mục không tồn tại');
    });

    it('should throw BadRequestError if slug exists', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: 'cat-1' } as any);
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);

      await expect(
        productService.create({
          name: 'Trà Ô Long Cao Cấp',
          price: 150000,
          categoryId: 'cat-1',
        })
      ).rejects.toThrow('Slug đã tồn tại');
    });
  });

  // ===========================================================================
  // update
  // ===========================================================================
  describe('update()', () => {
    it('should update product', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.product.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          product: {
            update: vi.fn().mockResolvedValue({
              ...mockProduct,
              name: 'Updated Name',
            }),
          },
          productImage: {
            deleteMany: vi.fn(),
            createMany: vi.fn(),
          },
        });
      });

      const result = await productService.update('prod-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundError if not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(
        productService.update('not-exist', { name: 'Test' })
      ).rejects.toThrow('Không tìm thấy sản phẩm');
    });

    it('should throw BadRequestError if new slug exists', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(mockProduct as any);
      vi.mocked(prisma.product.findFirst).mockResolvedValue({
        id: 'other-id',
        slug: 'duplicate',
      } as any);

      await expect(
        productService.update('prod-1', { name: 'Duplicate' })
      ).rejects.toThrow('Slug đã tồn tại');
    });
  });

  // ===========================================================================
  // delete
  // ===========================================================================
  describe('delete()', () => {
    it('should soft delete product with orders', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        _count: { orderItems: 5 },
      } as any);
      vi.mocked(prisma.product.update).mockResolvedValue({
        ...mockProduct,
        status: 'DISCONTINUED',
      } as any);

      const result = await productService.delete('prod-1');

      expect(result.message).toContain('thành công');
      expect(prisma.product.update).toHaveBeenCalled();
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });

    it('should hard delete product without orders', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue({
        ...mockProduct,
        _count: { orderItems: 0 },
      } as any);
      vi.mocked(prisma.product.delete).mockResolvedValue(mockProduct as any);

      const result = await productService.delete('prod-1');

      expect(result.message).toContain('thành công');
      expect(prisma.product.delete).toHaveBeenCalled();
    });

    it('should throw NotFoundError if not found', async () => {
      vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

      await expect(productService.delete('not-exist')).rejects.toThrow(
        'Không tìm thấy sản phẩm'
      );
    });
  });
});
