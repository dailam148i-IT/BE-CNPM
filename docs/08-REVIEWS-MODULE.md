# Bước 8: Reviews Module

## 8.1. Tổng Quan

Module Reviews xử lý:
- **Add Review** - Thêm đánh giá sản phẩm
- **Get Reviews** - Danh sách đánh giá
- **Delete Review** - Xóa đánh giá (user tự xóa hoặc admin)

---

## 8.2. Review Service

Tạo `src/modules/reviews/review.service.js`:

```javascript
import prisma from '../../database/prisma.js';

export const reviewService = {
  /**
   * Lấy đánh giá của sản phẩm
   */
  async findByProductId(productId, options = {}) {
    const { page = 1, limit = 10 } = options;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: {
          user: { select: { fullName: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.review.count({ where: { productId } })
    ]);

    // Tính rating stats
    const stats = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { id: true }
    });

    // Phân bố rating (1-5 stars)
    const distribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { productId },
      _count: { id: true }
    });

    const ratingDistribution = {};
    for (let i = 1; i <= 5; i++) {
      const found = distribution.find(d => d.rating === i);
      ratingDistribution[i] = found?._count.id || 0;
    }

    return {
      reviews,
      stats: {
        avgRating: stats._avg.rating || 0,
        totalReviews: stats._count.id,
        distribution: ratingDistribution
      },
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  },

  /**
   * Thêm đánh giá
   */
  async create(userId, data) {
    const { productId, rating, comment } = data;

    // Kiểm tra sản phẩm tồn tại
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }

    // Kiểm tra user đã mua sản phẩm chưa (optional)
    const hasPurchased = await prisma.orderDetail.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'COMPLETED'
        }
      }
    });

    // Kiểm tra đã đánh giá chưa
    const existingReview = await prisma.review.findFirst({
      where: { userId, productId }
    });

    if (existingReview) {
      throw new Error('Bạn đã đánh giá sản phẩm này');
    }

    return prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        commentText: comment
      },
      include: {
        user: { select: { fullName: true } }
      }
    });
  },

  /**
   * Cập nhật đánh giá
   */
  async update(userId, reviewId, data) {
    const review = await prisma.review.findFirst({
      where: { id: reviewId, userId }
    });

    if (!review) {
      throw new Error('Không tìm thấy đánh giá');
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: data.rating,
        commentText: data.comment
      }
    });
  },

  /**
   * Xóa đánh giá
   */
  async delete(userId, reviewId, isAdmin = false) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      throw new Error('Không tìm thấy đánh giá');
    }

    // Chỉ owner hoặc admin mới xóa được
    if (!isAdmin && review.userId !== userId) {
      throw new Error('Không có quyền xóa đánh giá này');
    }

    await prisma.review.delete({ where: { id: reviewId } });
    return { message: 'Xóa đánh giá thành công' };
  }
};
```

---

## 8.3. Review Controller & Routes

Tạo `src/modules/reviews/review.controller.js`:

```javascript
import { reviewService } from './review.service.js';

export const reviewController = {
  async getByProduct(req, res, next) {
    try {
      const result = await reviewService.findByProductId(req.params.productId, req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const review = await reviewService.create(req.user.userId, req.body);
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const review = await reviewService.update(req.user.userId, req.params.id, req.body);
      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const isAdmin = req.user.role === 'ADMIN';
      const result = await reviewService.delete(req.user.userId, req.params.id, isAdmin);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
};
```

Tạo `src/modules/reviews/review.routes.js`:

```javascript
import { Router } from 'express';
import { reviewController } from './review.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

// Public
router.get('/product/:productId', reviewController.getByProduct);

// Authenticated
router.post('/', authenticate, reviewController.create);
router.put('/:id', authenticate, reviewController.update);
router.delete('/:id', authenticate, reviewController.delete);

export default router;
```

---

## ✅ Checklist Bước 8

- [ ] Đã tạo review service, controller, routes
- [ ] Test: GET /api/reviews/product/:productId
- [ ] Test: POST /api/reviews
- [ ] Test: DELETE /api/reviews/:id

---

**Tiếp theo:** [09-NEWS-MODULE.md](./09-NEWS-MODULE.md)
