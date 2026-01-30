# Bước 3: Auth Module - Authentication System

## 3.1. Tổng Quan

Module Auth xử lý:
- **Register** - Đăng ký tài khoản
- **Login** - Đăng nhập (JWT Access Token + Refresh Token)
- **Refresh Token** - Làm mới access token
- **Logout** - Đăng xuất (revoke session)
- **Get Profile** - Lấy thông tin user hiện tại

## 3.2. Cấu trúc files

```
src/modules/auth/
├── auth.controller.js   # Xử lý HTTP request/response
├── auth.service.js      # Business logic
├── auth.routes.js       # Định nghĩa routes
└── auth.validation.js   # Joi schemas
```

---

## 3.3. Auth Service

Tạo `src/modules/auth/auth.service.js`:

```javascript
import prisma from '../../database/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Hash refresh token trước khi lưu DB (bảo mật)
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const authService = {
  /**
   * Đăng ký tài khoản mới
   * @param {object} data - { email, password, fullName, phone }
   */
  async register({ email, password, fullName, phone }) {
    // 1. Kiểm tra email đã tồn tại chưa
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { phone: phone || undefined }
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email đã được sử dụng');
      }
      if (phone && existingUser.phone === phone) {
        throw new Error('Số điện thoại đã được sử dụng');
      }
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Lấy role CUSTOMER
    const customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' }
    });

    if (!customerRole) {
      throw new Error('Hệ thống chưa được khởi tạo (thiếu role)');
    }

    // 4. Tạo user
    const user = await prisma.user.create({
      data: {
        username: email, // Dùng email làm username
        email,
        passwordHash,
        fullName,
        phone,
        roleId: customerRole.id
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        status: true,
        createdAt: true
      }
    });

    return user;
  },

  /**
   * Đăng nhập
   * @param {object} data - { identifier (email/phone), password }
   */
  async login({ identifier, password }) {
    // 1. Tìm user bằng email hoặc phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      include: { role: true }
    });

    if (!user) {
      throw new Error('Email/SĐT hoặc mật khẩu không đúng');
    }

    // 2. Kiểm tra password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Email/SĐT hoặc mật khẩu không đúng');
    }

    // 3. Kiểm tra trạng thái tài khoản
    if (user.status !== 'ACTIVE') {
      throw new Error('Tài khoản đã bị khóa');
    }

    // 4. Tạo Access Token (15 phút)
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        role: user.role.name 
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '15m' }
    );

    // 5. Tạo Refresh Token (7 ngày)
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: '7d' }
    );

    // 6. Lưu session vào database
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashToken(refreshToken),
        expiresAt
      }
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role.name
      }
    };
  },

  /**
   * Làm mới Access Token
   * @param {string} refreshToken
   */
  async refreshToken(refreshToken) {
    try {
      // 1. Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

      // 2. Tìm session trong DB
      const session = await prisma.session.findFirst({
        where: {
          refreshTokenHash: hashToken(refreshToken),
          revoked: false,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            include: { role: true }
          }
        }
      });

      if (!session) {
        throw new Error('Session không hợp lệ hoặc đã hết hạn');
      }

      // 3. Tạo access token mới
      const accessToken = jwt.sign(
        {
          userId: session.user.id,
          role: session.user.role.name
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: '15m' }
      );

      return { accessToken };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new Error('Refresh token không hợp lệ');
      }
      throw error;
    }
  },

  /**
   * Đăng xuất - Revoke session
   * @param {string} refreshToken
   */
  async logout(refreshToken) {
    if (!refreshToken) return;

    await prisma.session.updateMany({
      where: { refreshTokenHash: hashToken(refreshToken) },
      data: { revoked: true }
    });
  },

  /**
   * Lấy profile user hiện tại
   * @param {string} userId
   */
  async getProfile(userId) {
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
        role: {
          select: { name: true }
        },
        addresses: true,
        _count: {
          select: { orders: true, reviews: true }
        }
      }
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    return user;
  }
};
```

---

## 3.4. Auth Controller

Tạo `src/modules/auth/auth.controller.js`:

```javascript
import { authService } from './auth.service.js';

export const authController = {
  /**
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, fullName, phone } = req.body;
      
      const user = await authService.register({ 
        email, 
        password, 
        fullName, 
        phone 
      });

      res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data: user
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Hỗ trợ login bằng email hoặc phone
      const result = await authService.login({ 
        identifier: email, // field name giữ "email" cho tương thích FE
        password 
      });

      // Set refresh token vào HttpOnly cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      // Trả về access token và user info
      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          accessToken: result.accessToken,
          user: result.user
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy refresh token'
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      // Xóa cookie
      res.clearCookie('refreshToken');

      res.json({
        success: true,
        message: 'Đăng xuất thành công'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId; // Từ auth middleware
      const user = await authService.getProfile(userId);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
};
```

---

## 3.5. Auth Validation

Tạo `src/modules/auth/auth.validation.js`:

```javascript
import Joi from 'joi';

export const authValidation = {
  register: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Email không hợp lệ',
        'any.required': 'Email là bắt buộc'
      }),
    password: Joi.string()
      .min(6)
      .max(50)
      .required()
      .messages({
        'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
        'any.required': 'Mật khẩu là bắt buộc'
      }),
    fullName: Joi.string()
      .min(2)
      .max(100)
      .required()
      .messages({
        'any.required': 'Họ tên là bắt buộc'
      }),
    phone: Joi.string()
      .pattern(/^[0-9]{10,11}$/)
      .optional()
      .messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .required()
      .messages({
        'any.required': 'Email/SĐT là bắt buộc'
      }),
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'Mật khẩu là bắt buộc'
      })
  })
};
```

---

## 3.6. Auth Routes

Tạo `src/modules/auth/auth.routes.js`:

```javascript
import { Router } from 'express';
import { authController } from './auth.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { authValidation } from './auth.validation.js';

const router = Router();

// Public routes
router.post('/register', 
  validate(authValidation.register), 
  authController.register
);

router.post('/login', 
  validate(authValidation.login), 
  authController.login
);

router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);

export default router;
```

---

## 3.7. Kiến thức học được

### JWT Flow
```
1. Login → Server tạo Access Token (15m) + Refresh Token (7d)
2. Access Token lưu ở Frontend (memory/localStorage)
3. Refresh Token lưu trong HttpOnly Cookie (bảo mật hơn)
4. Khi Access Token hết hạn → Gọi /refresh để lấy token mới
5. Logout → Revoke session trong DB
```

### Bảo mật
- **Hash password**: bcrypt với salt rounds = 10
- **Hash refresh token**: SHA256 trước khi lưu DB
- **HttpOnly Cookie**: Chống XSS attack
- **Session trong DB**: Có thể revoke bất cứ lúc nào

---

## ✅ Checklist Bước 3

- [ ] Đã tạo `src/modules/auth/auth.service.js`
- [ ] Đã tạo `src/modules/auth/auth.controller.js`
- [ ] Đã tạo `src/modules/auth/auth.validation.js`
- [ ] Đã tạo `src/modules/auth/auth.routes.js`
- [ ] Test: POST /api/auth/register
- [ ] Test: POST /api/auth/login
- [ ] Test: GET /api/auth/profile

---

**Tiếp theo:** [04-USERS-MODULE.md](./04-USERS-MODULE.md)
