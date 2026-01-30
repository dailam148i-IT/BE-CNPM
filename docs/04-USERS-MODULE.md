# Bước 4: Users Module - User Management

## 4.1. Tổng Quan

Module Users xử lý:
- **Get All Users** (Admin) - Danh sách users
- **Get User By ID** (Admin) - Chi tiết user
- **Update User** - Cập nhật thông tin
- **Delete User** (Admin) - Xóa user
- **Manage Addresses** - CRUD địa chỉ giao hàng

## 4.2. Cấu trúc files

```
src/modules/users/
├── user.controller.js
├── user.service.js
├── user.routes.js
└── user.validation.js
```

---

## 4.3. User Service

Tạo `src/modules/users/user.service.js`:

```javascript
import prisma from '../../database/prisma.js';
import bcrypt from 'bcryptjs';

export const userService = {
  /**
   * Lấy danh sách users (Admin)
   */
  async findAll(options = {}) {
    const { page = 1, limit = 20, status, search } = options;

    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search } },
        { fullName: { contains: search } },
        { phone: { contains: search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          phone: true,
          status: true,
          createdAt: true,
          role: { select: { name: true } },
          _count: {
            select: { orders: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.user.count({ where })
    ]);

    // Thêm thông tin tổng chi tiêu
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const stats = await prisma.order.aggregate({
          where: { 
            userId: user.id, 
            status: 'COMPLETED' 
          },
          _sum: { totalMoney: true }
        });
        
        return {
          ...user,
          totalSpent: stats._sum.totalMoney || 0
        };
      })
    );

    return {
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  /**
   * Lấy chi tiết user
   */
  async findById(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        phone: true,
        dateOfBirth: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: { select: { name: true, description: true } },
        addresses: true,
        _count: {
          select: { orders: true, reviews: true }
        }
      }
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Lấy thêm thống kê đơn hàng
    const orderStats = await prisma.order.aggregate({
      where: { userId, status: 'COMPLETED' },
      _sum: { totalMoney: true },
      _count: { id: true }
    });

    // Lấy session cuối cùng (last login)
    const lastSession = await prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    return {
      ...user,
      stats: {
        totalOrders: orderStats._count.id,
        totalSpent: orderStats._sum.totalMoney || 0,
        lastLogin: lastSession?.createdAt || null
      }
    };
  },

  /**
   * Cập nhật thông tin user
   */
  async update(userId, data, updatedBy = null) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        status: data.status // Admin mới được update
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        dateOfBirth: true,
        status: true,
        updatedAt: true
      }
    });

    return user;
  },

  /**
   * Đổi mật khẩu
   */
  async changePassword(userId, oldPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Kiểm tra mật khẩu cũ
    const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Mật khẩu cũ không đúng');
    }

    // Hash mật khẩu mới
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });

    return { message: 'Đổi mật khẩu thành công' };
  },

  /**
   * Xóa user (Admin) - Soft delete bằng cách đổi status
   */
  async delete(userId) {
    // Kiểm tra không cho xóa admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: true }
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    if (user.role.name === 'ADMIN') {
      throw new Error('Không thể xóa tài khoản Admin');
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'DELETED' }
    });

    return { message: 'Xóa người dùng thành công' };
  },

  // ============ ADDRESS MANAGEMENT ============

  /**
   * Lấy danh sách địa chỉ
   */
  async getAddresses(userId) {
    return prisma.userAddress.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  },

  /**
   * Thêm địa chỉ mới
   */
  async addAddress(userId, data) {
    // Nếu set làm mặc định, bỏ mặc định của các địa chỉ khác
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId },
        data: { isDefault: false }
      });
    }

    return prisma.userAddress.create({
      data: {
        userId,
        recipientName: data.recipientName,
        phone: data.phone,
        address: data.address,
        isDefault: data.isDefault || false
      }
    });
  },

  /**
   * Cập nhật địa chỉ
   */
  async updateAddress(userId, addressId, data) {
    // Kiểm tra địa chỉ thuộc user
    const address = await prisma.userAddress.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw new Error('Không tìm thấy địa chỉ');
    }

    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId, id: { not: addressId } },
        data: { isDefault: false }
      });
    }

    return prisma.userAddress.update({
      where: { id: addressId },
      data: {
        recipientName: data.recipientName,
        phone: data.phone,
        address: data.address,
        isDefault: data.isDefault
      }
    });
  },

  /**
   * Xóa địa chỉ
   */
  async deleteAddress(userId, addressId) {
    const address = await prisma.userAddress.findFirst({
      where: { id: addressId, userId }
    });

    if (!address) {
      throw new Error('Không tìm thấy địa chỉ');
    }

    await prisma.userAddress.delete({
      where: { id: addressId }
    });

    return { message: 'Xóa địa chỉ thành công' };
  }
};
```

---

## 4.4. User Controller

Tạo `src/modules/users/user.controller.js`:

```javascript
import { userService } from './user.service.js';

export const userController = {
  // ============ ADMIN ROUTES ============

  async getAll(req, res, next) {
    try {
      const result = await userService.findAll(req.query);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await userService.findById(req.params.id);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const user = await userService.update(
        req.params.id, 
        req.body, 
        req.user.userId
      );
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async delete(req, res, next) {
    try {
      const result = await userService.delete(req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // ============ USER PROFILE ROUTES ============

  async updateProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const user = await userService.update(userId, req.body);
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req, res, next) {
    try {
      const userId = req.user.userId;
      const { oldPassword, newPassword } = req.body;
      const result = await userService.changePassword(userId, oldPassword, newPassword);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  },

  // ============ ADDRESS ROUTES ============

  async getAddresses(req, res, next) {
    try {
      const userId = req.user.userId;
      const addresses = await userService.getAddresses(userId);
      res.json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  },

  async addAddress(req, res, next) {
    try {
      const userId = req.user.userId;
      const address = await userService.addAddress(userId, req.body);
      res.status(201).json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  },

  async updateAddress(req, res, next) {
    try {
      const userId = req.user.userId;
      const address = await userService.updateAddress(userId, req.params.id, req.body);
      res.json({ success: true, data: address });
    } catch (error) {
      next(error);
    }
  },

  async deleteAddress(req, res, next) {
    try {
      const userId = req.user.userId;
      const result = await userService.deleteAddress(userId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
};
```

---

## 4.5. User Routes

Tạo `src/modules/users/user.routes.js`:

```javascript
import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();

// Tất cả routes đều cần authenticate
router.use(authenticate);

// ============ USER PROFILE ============
router.put('/profile', userController.updateProfile);
router.put('/change-password', userController.changePassword);

// ============ ADDRESSES ============
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', userController.updateAddress);
router.delete('/addresses/:id', userController.deleteAddress);

// ============ ADMIN ONLY ============
router.get('/', authorize('ADMIN'), userController.getAll);
router.get('/:id', authorize('ADMIN'), userController.getById);
router.put('/:id', authorize('ADMIN'), userController.update);
router.delete('/:id', authorize('ADMIN'), userController.delete);

export default router;
```

---

## ✅ Checklist Bước 4

- [ ] Đã tạo `src/modules/users/user.service.js`
- [ ] Đã tạo `src/modules/users/user.controller.js`
- [ ] Đã tạo `src/modules/users/user.routes.js`
- [ ] Test: GET /api/users (Admin)
- [ ] Test: PUT /api/users/profile
- [ ] Test: CRUD /api/users/addresses

---

**Tiếp theo:** [05-CATEGORIES-MODULE.md](./05-CATEGORIES-MODULE.md)
