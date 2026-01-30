# Bước 5: Categories Module

## 5.1. Tổng Quan

Module Categories xử lý:
- **CRUD Categories** - Quản lý danh mục
- **Hierarchical Categories** - Danh mục cha-con
- **Category Types** - PRODUCT, NEWS, PAGE

## 5.2. Category Service

Tạo `src/modules/categories/category.service.js`:

```javascript
import prisma from '../../database/prisma.js';
import slugify from 'slugify';

export const categoryService = {
  /**
   * Lấy tất cả categories (có filter)
   */
  async findAll(options = {}) {
    const { type, isActive, includeChildren = false } = options;

    const where = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    const categories = await prisma.category.findMany({
      where,
      include: {
        parent: { select: { id: true, name: true } },
        children: includeChildren ? { 
          select: { id: true, name: true, slug: true } 
        } : false,
        _count: {
          select: { products: true, news: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    return categories;
  },

  /**
   * Lấy categories dạng tree (cho menu)
   */
  async getTree(type = 'PRODUCT') {
    const categories = await prisma.category.findMany({
      where: { 
        type,
        isActive: true,
        parentId: null // Chỉ lấy root categories
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            children: { 
              where: { isActive: true } 
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return categories;
  },

  /**
   * Lấy category theo slug
   */
  async findBySlug(slug) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: true,
        products: {
          where: { status: 'PUBLISHED' },
          take: 10,
          include: {
            images: { where: { isThumbnail: true }, take: 1 }
          }
        }
      }
    });

    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    return category;
  },

  /**
   * Tạo category mới
   */
  async create(data) {
    const slug = slugify(data.name, { lower: true, locale: 'vi', strict: true });

    // Kiểm tra slug đã tồn tại
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new Error('Slug đã tồn tại, vui lòng đổi tên');
    }

    // Kiểm tra parent tồn tại
    if (data.parentId) {
      const parent = await prisma.category.findUnique({ 
        where: { id: data.parentId } 
      });
      if (!parent) {
        throw new Error('Danh mục cha không tồn tại');
      }
    }

    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId || null,
        type: data.type || 'PRODUCT',
        isActive: data.isActive ?? true
      }
    });
  },

  /**
   * Cập nhật category
   */
  async update(id, data) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    const updateData = {};

    if (data.name) {
      updateData.name = data.name;
      updateData.slug = slugify(data.name, { lower: true, locale: 'vi', strict: true });
      
      // Kiểm tra slug mới không trùng
      const existing = await prisma.category.findFirst({
        where: { 
          slug: updateData.slug,
          id: { not: id }
        }
      });
      if (existing) {
        throw new Error('Slug đã tồn tại');
      }
    }

    if (data.description !== undefined) updateData.description = data.description;
    if (data.parentId !== undefined) updateData.parentId = data.parentId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.type !== undefined) updateData.type = data.type;

    return prisma.category.update({
      where: { id },
      data: updateData
    });
  },

  /**
   * Xóa category
   */
  async delete(id) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, children: true } }
      }
    });

    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    if (category._count.products > 0) {
      throw new Error('Không thể xóa danh mục có sản phẩm');
    }

    if (category._count.children > 0) {
      throw new Error('Không thể xóa danh mục có danh mục con');
    }

    await prisma.category.delete({ where: { id } });
    return { message: 'Xóa danh mục thành công' };
  }
};
```

---

## 5.3. Category Controller & Routes

Tạo `src/modules/categories/category.controller.js`:

```javascript
import { categoryService } from './category.service.js';

export const categoryController = {
  async getAll(req, res, next) {
    try {
      const categories = await categoryService.findAll(req.query);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  },

  async getTree(req, res, next) {
    try {
      const { type = 'PRODUCT' } = req.query;
      const tree = await categoryService.getTree(type);
      res.json({ success: true, data: tree });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const category = await categoryService.findBySlug(req.params.slug);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const category = await categoryService.create(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const category = await categoryService.update(req.params.id, req.body);
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await categoryService.delete(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
};
```

Tạo `src/modules/categories/category.routes.js`:

```javascript
import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Public routes
router.get('/', categoryController.getAll);
router.get('/tree', categoryController.getTree);
router.get('/:slug', categoryController.getBySlug);

// Admin routes
router.post('/', authenticate, authorize('ADMIN'), categoryController.create);
router.put('/:id', authenticate, authorize('ADMIN'), categoryController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), categoryController.delete);

export default router;
```

---

## ✅ Checklist Bước 5

- [ ] Đã tạo category service, controller, routes
- [ ] Test: GET /api/categories
- [ ] Test: GET /api/categories/tree
- [ ] Test: POST /api/categories (Admin)

---

**Tiếp theo:** [06-PRODUCTS-MODULE.md](./06-PRODUCTS-MODULE.md)
