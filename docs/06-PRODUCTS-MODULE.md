# Bước 6: Products Module

## 6.1. Tổng Quan

Module Products xử lý:
- **List Products** - Danh sách với pagination, filter
- **Product Detail** - Chi tiết kèm images, reviews
- **CRUD Products** (Admin) - Quản lý sản phẩm
- **Product Images** - Quản lý ảnh sản phẩm

---

## 6.2. Product Service

Tạo `src/modules/products/product.service.js`:

```javascript
import prisma from '../../database/prisma.js';
import slugify from 'slugify';

export const productService = {
  /**
   * Lấy danh sách sản phẩm
   */
  async findAll(options = {}) {
    const { 
      page = 1, 
      limit = 12, 
      status, 
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    const where = {};

    // Filter by status (public chỉ thấy PUBLISHED)
    if (status) {
      where.status = status;
    }

    // Filter by category
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug }
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Search
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { shortDesc: { contains: search } }
      ];
    }

    // Sorting
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: { 
            where: { isThumbnail: true },
            take: 1
          },
          _count: { select: { reviews: true } }
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.product.count({ where })
    ]);

    // Tính rating trung bình cho mỗi sản phẩm
    const productsWithRating = await Promise.all(
      products.map(async (product) => {
        const avgRating = await prisma.review.aggregate({
          where: { productId: product.id },
          _avg: { rating: true }
        });
        
        return {
          ...product,
          thumbnail: product.images[0]?.imageUrl || null,
          avgRating: avgRating._avg.rating || 0,
          reviewCount: product._count.reviews
        };
      })
    );

    return {
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Lấy chi tiết sản phẩm theo slug
   */
  async findBySlug(slug) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    // Lấy reviews với user info
    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      include: {
        user: { select: { fullName: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Tính rating stats
    const ratingStats = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: { id: true }
    });

    // Lấy sản phẩm liên quan
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        status: 'PUBLISHED'
      },
      include: {
        images: { where: { isThumbnail: true }, take: 1 }
      },
      take: 4
    });

    return {
      ...product,
      reviews,
      avgRating: ratingStats._avg.rating || 0,
      reviewCount: ratingStats._count.id,
      relatedProducts
    };
  },

  /**
   * Lấy chi tiết theo ID (Admin)
   */
  async findById(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } }
      }
    });

    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    return product;
  },

  /**
   * Tạo sản phẩm mới
   */
  async create(data, images = []) {
    const slug = slugify(data.name, { lower: true, locale: 'vi', strict: true });

    // Kiểm tra slug
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new Error('Tên sản phẩm đã tồn tại');
    }

    // Transaction để tạo product + images
    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          shortDesc: data.shortDesc,
          price: data.price,
          stockQuantity: data.stockQuantity || 0,
          sku: data.sku,
          status: data.status || 'DRAFT',
          categoryId: data.categoryId
        }
      });

      // Tạo images
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img, index) => ({
            productId: product.id,
            imageUrl: img.url,
            isThumbnail: img.isThumbnail ?? (index === 0),
            sortOrder: img.sortOrder ?? index
          }))
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { images: true, category: true }
      });
    });
  },

  /**
   * Cập nhật sản phẩm
   */
  async update(id, data, newImages) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    return prisma.$transaction(async (tx) => {
      // 1. Update product info
      const updateData = {};
      
      if (data.name) {
        updateData.name = data.name;
        updateData.slug = slugify(data.name, { lower: true, locale: 'vi', strict: true });
      }
      if (data.description !== undefined) updateData.description = data.description;
      if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

      if (Object.keys(updateData).length > 0) {
        await tx.product.update({
          where: { id },
          data: updateData
        });
      }

      // 2. Update images (nếu có)
      if (newImages !== undefined) {
        // Xóa images cũ
        await tx.productImage.deleteMany({ where: { productId: id } });

        // Thêm images mới
        if (newImages.length > 0) {
          await tx.productImage.createMany({
            data: newImages.map((img, index) => ({
              productId: id,
              imageUrl: img.url,
              isThumbnail: img.isThumbnail ?? (index === 0),
              sortOrder: img.sortOrder ?? index
            }))
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: { images: true, category: true }
      });
    });
  },

  /**
   * Xóa sản phẩm
   */
  async delete(id) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderDetails: true } } }
    });

    if (!product) {
      throw new Error('Không tìm thấy sản phẩm');
    }

    if (product._count.orderDetails > 0) {
      // Soft delete - chuyển sang DISCONTINUED
      await prisma.product.update({
        where: { id },
        data: { status: 'DISCONTINUED' }
      });
      return { message: 'Sản phẩm đã được ẩn (đã có đơn hàng)' };
    }

    // Hard delete
    await prisma.product.delete({ where: { id } });
    return { message: 'Xóa sản phẩm thành công' };
  }
};
```

---

## 6.3. Product Controller

Tạo `src/modules/products/product.controller.js`:

```javascript
import { productService } from './product.service.js';

export const productController = {
  async getAll(req, res, next) {
    try {
      // Public: chỉ lấy PUBLISHED
      const options = {
        ...req.query,
        status: req.query.status || 'PUBLISHED'
      };
      const result = await productService.findAll(options);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getAllAdmin(req, res, next) {
    try {
      // Admin: lấy tất cả status
      const result = await productService.findAll(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const product = await productService.findBySlug(req.params.slug);
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const product = await productService.findById(req.params.id);
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const { images, ...productData } = req.body;
      const product = await productService.create(productData, images);
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const { images, ...productData } = req.body;
      const product = await productService.update(req.params.id, productData, images);
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await productService.delete(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
};
```

---

## 6.4. Product Routes

Tạo `src/modules/products/product.routes.js`:

```javascript
import { Router } from 'express';
import { productController } from './product.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// ============ PUBLIC ROUTES ============
router.get('/', productController.getAll);
router.get('/detail/:slug', productController.getBySlug);

// ============ ADMIN ROUTES ============
router.get('/admin', authenticate, authorize('ADMIN'), productController.getAllAdmin);
router.get('/admin/:id', authenticate, authorize('ADMIN'), productController.getById);
router.post('/', authenticate, authorize('ADMIN'), productController.create);
router.put('/:id', authenticate, authorize('ADMIN'), productController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), productController.delete);

export default router;
```

---

## ✅ Checklist Bước 6

- [ ] Đã tạo product service, controller, routes
- [ ] Test: GET /api/products (public)
- [ ] Test: GET /api/products/detail/:slug
- [ ] Test: POST /api/products (Admin)
- [ ] Test: PUT /api/products/:id (Admin)

---

**Tiếp theo:** [07-CART-ORDERS.md](./07-CART-ORDERS.md)
