# Bước 7: Cart & Orders Module

## 7.1. Tổng Quan

Bao gồm 2 sub-modules:
- **Cart** - Giỏ hàng (add, update, remove, clear)
- **Orders** - Đơn hàng (checkout, history, admin management)

---

## 7.2. Cart Service

Tạo `src/modules/cart/cart.service.js`:

```javascript
import prisma from '../../database/prisma.js';

export const cartService = {
  /**
   * Lấy hoặc tạo cart cho user
   */
  async getOrCreateCart(userId) {
    let cart = await prisma.cart.findFirst({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isThumbnail: true }, take: 1 }
              }
            }
          }
        }
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { where: { isThumbnail: true }, take: 1 }
                }
              }
            }
          }
        }
      });
    }

    // Tính tổng tiền
    const total = cart.items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    return {
      ...cart,
      itemCount: cart.items.length,
      total
    };
  },

  /**
   * Thêm sản phẩm vào giỏ
   */
  async addItem(userId, productId, quantity = 1) {
    const cart = await this.getOrCreateCart(userId);

    // Kiểm tra product tồn tại và còn hàng
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new Error('Sản phẩm không tồn tại');
    }

    if (product.status !== 'PUBLISHED') {
      throw new Error('Sản phẩm không khả dụng');
    }

    if (product.stockQuantity < quantity) {
      throw new Error('Số lượng tồn kho không đủ');
    }

    // Kiểm tra đã có trong giỏ chưa
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId }
    });

    if (existingItem) {
      // Cập nhật số lượng
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stockQuantity) {
        throw new Error('Vượt quá số lượng tồn kho');
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity }
      });
    } else {
      // Thêm mới
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity
        }
      });
    }

    return this.getOrCreateCart(userId);
  },

  /**
   * Cập nhật số lượng
   */
  async updateItemQuantity(userId, itemId, quantity) {
    const cart = await this.getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { product: true }
    });

    if (!item) {
      throw new Error('Không tìm thấy sản phẩm trong giỏ');
    }

    if (quantity < 1) {
      throw new Error('Số lượng phải lớn hơn 0');
    }

    if (quantity > item.product.stockQuantity) {
      throw new Error('Vượt quá số lượng tồn kho');
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });

    return this.getOrCreateCart(userId);
  },

  /**
   * Xóa sản phẩm khỏi giỏ
   */
  async removeItem(userId, itemId) {
    const cart = await this.getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id }
    });

    if (!item) {
      throw new Error('Không tìm thấy sản phẩm trong giỏ');
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return this.getOrCreateCart(userId);
  },

  /**
   * Xóa toàn bộ giỏ hàng
   */
  async clearCart(userId) {
    const cart = await prisma.cart.findFirst({ where: { userId } });
    
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return { message: 'Đã xóa giỏ hàng' };
  }
};
```

---

## 7.3. Order Service

Tạo `src/modules/orders/order.service.js`:

```javascript
import prisma from '../../database/prisma.js';

export const orderService = {
  /**
   * Đặt hàng từ giỏ
   */
  async checkout(userId, data) {
    return prisma.$transaction(async (tx) => {
      // 1. Lấy giỏ hàng
      const cart = await tx.cart.findFirst({
        where: { userId },
        include: {
          items: {
            include: { product: true }
          }
        }
      });

      if (!cart || cart.items.length === 0) {
        throw new Error('Giỏ hàng trống');
      }

      // 2. Validate và chuẩn bị order details
      const orderDetails = [];
      let subtotal = 0;

      for (const item of cart.items) {
        const product = item.product;

        // Kiểm tra còn hàng
        if (product.stockQuantity < item.quantity) {
          throw new Error(`Sản phẩm "${product.name}" không đủ hàng (còn ${product.stockQuantity})`);
        }

        // Kiểm tra status
        if (product.status !== 'PUBLISHED') {
          throw new Error(`Sản phẩm "${product.name}" không còn bán`);
        }

        orderDetails.push({
          productId: product.id,
          price: product.price,
          quantity: item.quantity
        });

        subtotal += Number(product.price) * item.quantity;

        // Trừ tồn kho
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: { decrement: item.quantity }
          }
        });
      }

      // 3. Tính toán
      const shippingFee = data.shippingFee || 0;
      const discountAmount = data.discountAmount || 0;
      const totalMoney = subtotal + shippingFee - discountAmount;

      // 4. Tạo order
      const order = await tx.order.create({
        data: {
          userId,
          subtotal,
          shippingFee,
          discountAmount,
          totalMoney,
          shippingAddress: data.shippingAddress,
          shippingPhone: data.shippingPhone,
          note: data.note,
          details: {
            create: orderDetails
          }
        },
        include: {
          details: {
            include: {
              product: {
                include: {
                  images: { where: { isThumbnail: true }, take: 1 }
                }
              }
            }
          }
        }
      });

      // 5. Xóa giỏ hàng
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return order;
    });
  },

  /**
   * Lấy đơn hàng của user
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, status } = options;

    const where = { userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          details: {
            take: 1,
            include: {
              product: {
                include: {
                  images: { where: { isThumbnail: true }, take: 1 }
                }
              }
            }
          },
          _count: { select: { details: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  },

  /**
   * Chi tiết đơn hàng
   */
  async findById(id, userId = null) {
    const where = { id };
    if (userId) where.userId = userId; // Chỉ lấy đơn của user

    const order = await prisma.order.findFirst({
      where,
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        details: {
          include: {
            product: {
              include: {
                images: { where: { isThumbnail: true }, take: 1 }
              }
            }
          }
        },
        transactions: true
      }
    });

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    return order;
  },

  /**
   * Cập nhật trạng thái (Admin)
   */
  async updateStatus(id, status) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      throw new Error('Trạng thái không hợp lệ');
    }

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    // Business rules
    if (order.status === 'COMPLETED') {
      throw new Error('Không thể thay đổi đơn hàng đã hoàn thành');
    }

    if (order.status === 'CANCELLED') {
      throw new Error('Không thể thay đổi đơn hàng đã hủy');
    }

    // Hoàn lại tồn kho nếu hủy
    if (status === 'CANCELLED') {
      const details = await prisma.orderDetail.findMany({
        where: { orderId: id }
      });

      for (const detail of details) {
        await prisma.product.update({
          where: { id: detail.productId },
          data: { stockQuantity: { increment: detail.quantity } }
        });
      }
    }

    return prisma.order.update({
      where: { id },
      data: { status }
    });
  },

  /**
   * Cập nhật trạng thái thanh toán
   */
  async updatePaymentStatus(id, paymentStatus) {
    return prisma.order.update({
      where: { id },
      data: { paymentStatus }
    });
  },

  /**
   * Admin: Lấy tất cả đơn hàng
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, status, search } = options;

    const where = {};
    if (status && status !== 'ALL') where.status = status;
    
    if (search) {
      where.OR = [
        { shippingPhone: { contains: search } },
        { id: { contains: search } }
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { fullName: true, email: true } },
          _count: { select: { details: true } },
          transactions: { take: 1 }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.order.count({ where })
    ]);

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    };
  }
};
```

---

## 7.4. Cart & Order Controllers

Tạo `src/modules/cart/cart.controller.js`:

```javascript
import { cartService } from './cart.service.js';

export const cartController = {
  async getCart(req, res, next) {
    try {
      const cart = await cartService.getOrCreateCart(req.user.userId);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

  async addItem(req, res, next) {
    try {
      const { productId, quantity } = req.body;
      const cart = await cartService.addItem(req.user.userId, productId, quantity);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

  async updateItem(req, res, next) {
    try {
      const { quantity } = req.body;
      const cart = await cartService.updateItemQuantity(
        req.user.userId, 
        req.params.itemId, 
        quantity
      );
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

  async removeItem(req, res, next) {
    try {
      const cart = await cartService.removeItem(req.user.userId, req.params.itemId);
      res.json({ success: true, data: cart });
    } catch (error) {
      next(error);
    }
  },

  async clearCart(req, res, next) {
    try {
      const result = await cartService.clearCart(req.user.userId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
};
```

Tạo `src/modules/orders/order.controller.js`:

```javascript
import { orderService } from './order.service.js';

export const orderController = {
  async checkout(req, res, next) {
    try {
      const order = await orderService.checkout(req.user.userId, req.body);
      res.status(201).json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  async getMyOrders(req, res, next) {
    try {
      const result = await orderService.findByUserId(req.user.userId, req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getOrderDetail(req, res, next) {
    try {
      const order = await orderService.findById(req.params.id, req.user.userId);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  // Admin
  async getAllOrders(req, res, next) {
    try {
      const result = await orderService.findAll(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const order = await orderService.updateStatus(req.params.id, req.body.status);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  },

  async updatePaymentStatus(req, res, next) {
    try {
      const order = await orderService.updatePaymentStatus(
        req.params.id, 
        req.body.paymentStatus
      );
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
};
```

---

## 7.5. Routes

Tạo `src/modules/cart/cart.routes.js`:

```javascript
import { Router } from 'express';
import { cartController } from './cart.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;
```

Tạo `src/modules/orders/order.routes.js`:

```javascript
import { Router } from 'express';
import { orderController } from './order.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(authenticate);

// User routes
router.post('/checkout', orderController.checkout);
router.get('/my-orders', orderController.getMyOrders);
router.get('/my-orders/:id', orderController.getOrderDetail);

// Admin routes
router.get('/', authorize('ADMIN'), orderController.getAllOrders);
router.put('/:id/status', authorize('ADMIN'), orderController.updateStatus);
router.put('/:id/payment-status', authorize('ADMIN'), orderController.updatePaymentStatus);

export default router;
```

---

## ✅ Checklist Bước 7

- [ ] Đã tạo cart service, controller, routes
- [ ] Đã tạo order service, controller, routes  
- [ ] Test: GET /api/cart
- [ ] Test: POST /api/cart/items
- [ ] Test: POST /api/orders/checkout
- [ ] Test: GET /api/orders/my-orders

---

**Tiếp theo:** [08-REVIEWS-MODULE.md](./08-REVIEWS-MODULE.md)
