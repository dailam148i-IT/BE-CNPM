# Bước 9: News Module

## 9.1. Tổng Quan

Module News xử lý:
- **News List** - Danh sách bài viết/tin tức
- **News Detail** - Chi tiết bài viết
- **CRUD News** (Admin) - Quản lý bài viết

---

## 9.2. News Service

Tạo `src/modules/news/news.service.js`:

```javascript
import prisma from '../../database/prisma.js';
import slugify from 'slugify';

export const newsService = {
  /**
   * Lấy danh sách bài viết
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, status, categoryId, search } = options;

    const where = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { fullName: true } }
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.news.count({ where })
    ]);

    return {
      news,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  },

  /**
   * Lấy chi tiết bài viết
   */
  async findBySlug(slug) {
    const news = await prisma.news.findUnique({
      where: { slug },
      include: {
        category: true,
        author: { select: { fullName: true } }
      }
    });

    if (!news) {
      throw new Error('Không tìm thấy bài viết');
    }

    // Lấy bài viết liên quan
    const related = await prisma.news.findMany({
      where: {
        categoryId: news.categoryId,
        id: { not: news.id },
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        imageUrl: true,
        publishedAt: true
      },
      take: 4
    });

    return { ...news, relatedNews: related };
  },

  /**
   * Tạo bài viết mới
   */
  async create(authorId, data) {
    const slug = slugify(data.title, { lower: true, locale: 'vi', strict: true });

    // Kiểm tra slug
    const existing = await prisma.news.findUnique({ where: { slug } });
    if (existing) {
      throw new Error('Tiêu đề đã tồn tại');
    }

    return prisma.news.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        content: data.content,
        imageUrl: data.imageUrl,
        status: data.status || 'DRAFT',
        categoryId: data.categoryId,
        authorId
      },
      include: { category: true, author: { select: { fullName: true } } }
    });
  },

  /**
   * Cập nhật bài viết
   */
  async update(id, data) {
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) {
      throw new Error('Không tìm thấy bài viết');
    }

    const updateData = {};
    
    if (data.title) {
      updateData.title = data.title;
      updateData.slug = slugify(data.title, { lower: true, locale: 'vi', strict: true });
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

    return prisma.news.update({
      where: { id },
      data: updateData,
      include: { category: true }
    });
  },

  /**
   * Xóa bài viết
   */
  async delete(id) {
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) {
      throw new Error('Không tìm thấy bài viết');
    }

    await prisma.news.delete({ where: { id } });
    return { message: 'Xóa bài viết thành công' };
  }
};
```

---

## 9.3. News Controller & Routes

Tạo `src/modules/news/news.controller.js`:

```javascript
import { newsService } from './news.service.js';

export const newsController = {
  async getAll(req, res, next) {
    try {
      const options = { ...req.query, status: 'PUBLISHED' };
      const result = await newsService.findAll(options);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAllAdmin(req, res, next) {
    try {
      const result = await newsService.findAll(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const news = await newsService.findBySlug(req.params.slug);
      res.json({ success: true, data: news });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const news = await newsService.create(req.user.userId, req.body);
      res.status(201).json({ success: true, data: news });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const news = await newsService.update(req.params.id, req.body);
      res.json({ success: true, data: news });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await newsService.delete(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
};
```

Tạo `src/modules/news/news.routes.js`:

```javascript
import { Router } from 'express';
import { newsController } from './news.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Public
router.get('/', newsController.getAll);
router.get('/:slug', newsController.getBySlug);

// Admin
router.get('/admin/all', authenticate, authorize('ADMIN'), newsController.getAllAdmin);
router.post('/', authenticate, authorize('ADMIN'), newsController.create);
router.put('/:id', authenticate, authorize('ADMIN'), newsController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), newsController.delete);

export default router;
```

---

## ✅ Checklist Bước 9

- [ ] Đã tạo news service, controller, routes
- [ ] Test: GET /api/news
- [ ] Test: POST /api/news (Admin)

---

**Tiếp theo:** [10-UPLOADS-MODULE.md](./10-UPLOADS-MODULE.md)
