/**
 * =============================================================================
 * CATEGORY.SERVICE.TEST.TS - Unit Tests cho Category Service
 * =============================================================================
 * 
 * Test các business logic methods:
 * - findAll()    - Lấy danh sách
 * - getTree()    - Lấy cây phân cấp
 * - findBySlug() - Lấy theo slug
 * - create()     - Tạo mới
 * - update()     - Cập nhật
 * - delete()     - Xóa
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { categoryService } from '../../modules/categories/category.service.js';
import prisma from '../../config/database.js';

// Import setup để mock Prisma
import '../setup.js';

// Mock data
const mockCategory = {
  id: 'cml0ojfcl000379jwugrym1n6',
  name: 'Trà Ô Long',
  slug: 'tra-o-long',
  description: 'Trà Ô Long cao cấp',
  parentId: null,
  isActive: true,
  type: 'PRODUCT',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Category Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // findAll
  // ===========================================================================
  describe('findAll()', () => {
    it('should return all categories', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([mockCategory] as any);

      const result = await categoryService.findAll({});

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(1);
      expect(prisma.category.findMany).toHaveBeenCalled();
    });

    it('should filter by type', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);

      await categoryService.findAll({ type: 'NEWS' });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'NEWS' }),
        })
      );
    });

    it('should filter by isActive', async () => {
      vi.mocked(prisma.category.findMany).mockResolvedValue([]);

      await categoryService.findAll({ isActive: true });

      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isActive: true }),
        })
      );
    });
  });

  // ===========================================================================
  // getTree
  // ===========================================================================
  describe('getTree()', () => {
    it('should return tree structure', async () => {
      const mockTree = [
        {
          ...mockCategory,
          children: [{ id: 'child-1', name: 'Child', children: [] }],
        },
      ];
      vi.mocked(prisma.category.findMany).mockResolvedValue(mockTree as any);

      const result = await categoryService.getTree('PRODUCT');

      expect(result).toBeInstanceOf(Array);
      expect(prisma.category.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            parentId: null,
            isActive: true,
          }),
        })
      );
    });
  });

  // ===========================================================================
  // findBySlug
  // ===========================================================================
  describe('findBySlug()', () => {
    it('should return category by slug', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategory,
        products: [],
      } as any);

      const result = await categoryService.findBySlug('tra-o-long');

      expect(result.slug).toBe('tra-o-long');
    });

    it('should throw NotFoundError if not found', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(categoryService.findBySlug('not-exist')).rejects.toThrow(
        'Không tìm thấy danh mục'
      );
    });
  });

  // ===========================================================================
  // create
  // ===========================================================================
  describe('create()', () => {
    it('should create category with valid data', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.category.create).mockResolvedValue(mockCategory as any);

      const result = await categoryService.create({
        name: 'Trà Ô Long',
        description: 'Trà Ô Long cao cấp',
        type: 'PRODUCT',
        isActive: true,
      });

      expect(result.name).toBe('Trà Ô Long');
      expect(prisma.category.create).toHaveBeenCalled();
    });

    it('should throw BadRequestError if slug exists', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as any);

      await expect(
        categoryService.create({
          name: 'Trà Ô Long',
          type: 'PRODUCT',
          isActive: true,
        })
      ).rejects.toThrow('Slug đã tồn tại');
    });

    it('should throw NotFoundError if parent not exists', async () => {
      vi.mocked(prisma.category.findUnique)
        .mockResolvedValueOnce(null) // slug check
        .mockResolvedValueOnce(null); // parent check

      await expect(
        categoryService.create({
          name: 'Trà Con',
          parentId: 'not-exist-parent',
          type: 'PRODUCT',
          isActive: true,
        })
      ).rejects.toThrow('Danh mục cha không tồn tại');
    });
  });

  // ===========================================================================
  // update
  // ===========================================================================
  describe('update()', () => {
    it('should update category', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as any);
      vi.mocked(prisma.category.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.category.update).mockResolvedValue({
        ...mockCategory,
        name: 'Updated Name',
      } as any);

      const result = await categoryService.update('cml0ojfcl000379jwugrym1n6', {
        name: 'Updated Name',
      });

      expect(result.name).toBe('Updated Name');
    });

    it('should throw NotFoundError if not found', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(
        categoryService.update('not-exist', { name: 'Test' })
      ).rejects.toThrow('Không tìm thấy danh mục');
    });

    it('should throw BadRequestError if new slug exists', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(mockCategory as any);
      vi.mocked(prisma.category.findFirst).mockResolvedValue({
        id: 'other-id',
        slug: 'duplicate-slug',
      } as any);

      await expect(
        categoryService.update('cml0ojfcl000379jwugrym1n6', { name: 'Duplicate Slug' })
      ).rejects.toThrow('Slug đã tồn tại');
    });
  });

  // ===========================================================================
  // delete
  // ===========================================================================
  describe('delete()', () => {
    it('should delete category without products or children', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategory,
        _count: { products: 0, children: 0 },
      } as any);
      vi.mocked(prisma.category.delete).mockResolvedValue(mockCategory as any);

      const result = await categoryService.delete('cml0ojfcl000379jwugrym1n6');

      expect(result.message).toBe('Xóa danh mục thành công');
    });

    it('should throw NotFoundError if not found', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

      await expect(categoryService.delete('not-exist')).rejects.toThrow(
        'Không tìm thấy danh mục'
      );
    });

    it('should throw BadRequestError if has products', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategory,
        _count: { products: 5, children: 0 },
      } as any);

      await expect(
        categoryService.delete('cml0ojfcl000379jwugrym1n6')
      ).rejects.toThrow('Không thể xóa danh mục có sản phẩm');
    });

    it('should throw BadRequestError if has children', async () => {
      vi.mocked(prisma.category.findUnique).mockResolvedValue({
        ...mockCategory,
        _count: { products: 0, children: 2 },
      } as any);

      await expect(
        categoryService.delete('cml0ojfcl000379jwugrym1n6')
      ).rejects.toThrow('Không thể xóa danh mục có danh mục con');
    });
  });
});
