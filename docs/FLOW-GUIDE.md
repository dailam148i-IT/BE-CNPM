# Express + TypeScript - Luồng Xử Lý Chi Tiết

> Hướng dẫn hiểu cách Backend xử lý từ Request → Response

## 📋 Mục Lục

1. [Tổng quan luồng Request](#1-tổng-quan-luồng-request)
2. [Middleware Pipeline](#2-middleware-pipeline)
3. [Cấu trúc Module](#3-cấu-trúc-module)
4. [Ví dụ thực tế: Auth Module](#4-ví-dụ-thực-tế-auth-module)
5. [Database Layer](#5-database-layer)
6. [Error Handling](#6-error-handling)

---

## 1. Tổng Quan Luồng Request

### 1.1. Request → Response Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             CLIENT                                      │
│                 (Browser, Mobile App, Postman)                          │
│                                                                         │
│                    POST /api/auth/login                                 │
│                    Body: { email, password }                            │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS SERVER                                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    MIDDLEWARE PIPELINE                           │   │
│  │                                                                  │   │
│  │  1. cors()          → Kiểm tra origin                           │   │
│  │  2. express.json()  → Parse JSON body                           │   │
│  │  3. cookieParser()  → Parse cookies                             │   │
│  │  4. rateLimit()     → Giới hạn requests                         │   │
│  │  5. authenticate()  → Kiểm tra JWT (nếu cần)                    │   │
│  │  6. validate()      → Validate input                            │   │
│  │                                                                  │   │
│  └────────────────────────────┬────────────────────────────────────┘   │
│                               │                                         │
│                               ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         ROUTER                                   │   │
│  │                                                                  │   │
│  │  router.post('/login', validate(schema), controller.login)      │   │
│  │                                                                  │   │
│  └────────────────────────────┬────────────────────────────────────┘   │
│                               │                                         │
│                               ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                       CONTROLLER                                 │   │
│  │                                                                  │   │
│  │  - Nhận request                                                  │   │
│  │  - Gọi Service                                                   │   │
│  │  - Trả response                                                  │   │
│  │                                                                  │   │
│  └────────────────────────────┬────────────────────────────────────┘   │
│                               │                                         │
│                               ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                        SERVICE                                   │   │
│  │                                                                  │   │
│  │  - Business logic                                                │   │
│  │  - Gọi Prisma (Database)                                        │   │
│  │  - Hash password, tạo JWT...                                    │   │
│  │                                                                  │   │
│  └────────────────────────────┬────────────────────────────────────┘   │
│                               │                                         │
│                               ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PRISMA CLIENT                                 │   │
│  │                                                                  │   │
│  │  prisma.user.findUnique({ where: { email } })                   │   │
│  │                                                                  │   │
│  └────────────────────────────┬────────────────────────────────────┘   │
│                               │                                         │
└───────────────────────────────┼─────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          MySQL DATABASE                                  │
│                                                                         │
│   SELECT * FROM users WHERE email = 'john@example.com'                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2. Tóm tắt các Layer

| Layer | File | Nhiệm vụ |
|-------|------|----------|
| **Router** | `*.routes.ts` | Định nghĩa endpoints, gắn middleware |
| **Controller** | `*.controller.ts` | Nhận request, gọi service, trả response |
| **Service** | `*.service.ts` | Business logic, gọi database |
| **Database** | `config/database.ts` | Prisma Client kết nối MySQL |

---

## 2. Middleware Pipeline

### 2.1. Middleware là gì?

**Middleware** = Hàm được gọi **TRƯỚC** khi request đến handler chính.

```typescript
// Cấu trúc của một middleware
const middleware = (req: Request, res: Response, next: NextFunction) => {
  // 1. Làm gì đó với request
  console.log(`${req.method} ${req.path}`);
  
  // 2. Quyết định:
  //    - next() → Tiếp tục đến middleware tiếp theo
  //    - res.json() → Kết thúc, trả response
  //    - next(error) → Chuyển đến error handler
  
  next(); // Cho phép request tiếp tục
};
```

### 2.2. Thứ tự thực thi Middleware

```typescript
// server.ts

// Middleware GLOBAL (chạy cho MỌI request)
app.use(cors());           // 1️⃣
app.use(express.json());   // 2️⃣
app.use(cookieParser());   // 3️⃣
app.use(rateLimit());      // 4️⃣

// Routes với middleware RIÊNG
app.use('/api/auth', authRoutes);      // Public routes
app.use('/api/products', productRoutes); // Public routes
app.use('/api/orders', authenticate, orderRoutes); // 5️⃣ Protected

// Error handler (CUỐI CÙNG)
app.use(errorHandler);     // 6️⃣
```

### 2.3. Ví dụ thực tế

```typescript
// Request: POST /api/orders

// 1. cors() → Kiểm tra origin OK → next()
// 2. express.json() → Parse body → next()
// 3. cookieParser() → Parse cookies → next()
// 4. rateLimit() → Chưa vượt limit → next()
// 5. authenticate() → Kiểm tra JWT trong header
//    - Nếu OK → gắn req.user, next()
//    - Nếu FAIL → res.status(401).json({...})
// 6. Controller xử lý → res.json({...})
```

---

## 3. Cấu Trúc Module

### 3.1. Cấu trúc thư mục

```
src/modules/auth/
├── auth.routes.ts      # Định nghĩa routes
├── auth.controller.ts  # Xử lý request/response
├── auth.service.ts     # Business logic
└── auth.validation.ts  # Joi schemas
```

### 3.2. Routes - Định nghĩa endpoints

```typescript
// auth.routes.ts
import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { loginSchema, registerSchema } from './auth.validation';

const router = Router();

// POST /api/auth/register
router.post('/register', 
  validate(registerSchema),  // Middleware validate
  authController.register    // Handler
);

// POST /api/auth/login
router.post('/login',
  validate(loginSchema),
  authController.login
);

// POST /api/auth/logout (cần login)
router.post('/logout',
  authenticate,              // Middleware kiểm tra JWT
  authController.logout
);

export default router;
```

### 3.3. Controller - Xử lý Request/Response

```typescript
// auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { success, error } from '../../utils/response';

export const authController = {
  // Đăng nhập
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Lấy data từ request body
      const { email, password } = req.body;

      // 2. Gọi service xử lý logic
      const result = await authService.login(email, password);

      // 3. Set cookie (refresh token)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,    // Không cho JS access
        secure: true,      // Chỉ gửi qua HTTPS
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
      });

      // 4. Trả response
      success(res, {
        user: result.user,
        accessToken: result.accessToken,
      });
    } catch (err) {
      // 5. Nếu lỗi → chuyển đến error handler
      next(err);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userData = req.body;
      const user = await authService.register(userData);
      success(res, user, 201); // 201 = Created
    } catch (err) {
      next(err);
    }
  },
};
```

### 3.4. Service - Business Logic

```typescript
// auth.service.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

export const authService = {
  async login(email: string, password: string) {
    // 1. Tìm user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    // 2. So sánh password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    // 3. Check status
    if (user.status !== 'ACTIVE') {
      throw new AppError('Tài khoản đã bị khóa', 403);
    }

    // 4. Tạo tokens
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    // 5. Lưu session
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: await bcrypt.hash(refreshToken, 10),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 6. Trả về (không trả password)
    const { passwordHash, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  },

  async register(data: RegisterInput) {
    // 1. Check email tồn tại
    const exists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (exists) {
      throw new AppError('Email đã được sử dụng', 400);
    }

    // 2. Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 3. Tìm role CUSTOMER
    const role = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });

    // 4. Tạo user
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        roleId: role!.id,
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },
};
```

### 3.5. Validation - Kiểm tra input

```typescript
// auth.validation.ts
import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email không hợp lệ',
    'any.required': 'Email là bắt buộc',
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
    'any.required': 'Mật khẩu là bắt buộc',
  }),
});

export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().max(100),
  phone: Joi.string().pattern(/^[0-9]{10,11}$/),
});
```

---

## 4. Ví Dụ Thực Tế: Auth Module

### 4.1. Luồng đăng nhập

```
Client                  Server                   Database
  │                        │                        │
  │ POST /api/auth/login   │                        │
  │ {email, password}      │                        │
  │───────────────────────>│                        │
  │                        │                        │
  │          ┌─────────────┴─────────────┐          │
  │          │ 1. cors() → OK            │          │
  │          │ 2. express.json() → parse │          │
  │          │ 3. validate() → OK        │          │
  │          └─────────────┬─────────────┘          │
  │                        │                        │
  │                        │ SELECT * FROM users    │
  │                        │ WHERE email = ?        │
  │                        │───────────────────────>│
  │                        │                        │
  │                        │     User data          │
  │                        │<───────────────────────│
  │                        │                        │
  │          ┌─────────────┴─────────────┐          │
  │          │ 4. bcrypt.compare()       │          │
  │          │ 5. jwt.sign() → tokens    │          │
  │          └─────────────┬─────────────┘          │
  │                        │                        │
  │                        │ INSERT sessions        │
  │                        │───────────────────────>│
  │                        │                        │
  │ { user, accessToken }  │                        │
  │ Set-Cookie: refreshT...│                        │
  │<───────────────────────│                        │
  │                        │                        │
```

### 4.2. Luồng kiểm tra JWT

```typescript
// middleware/authenticate.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './errorHandler';

// Mở rộng Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Lấy token từ header
    const authHeader = req.headers.authorization;
    // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token không được cung cấp');
    }

    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const payload = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET!
    ) as { userId: string; role: string };

    // 3. Gắn user info vào request
    req.user = payload;

    // 4. Tiếp tục
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new UnauthorizedError('Token đã hết hạn');
    }
    throw new UnauthorizedError('Token không hợp lệ');
  }
};
```

---

## 5. Database Layer

### 5.1. Prisma Client hoạt động thế nào?

```typescript
// config/database.ts

import { PrismaClient } from '@prisma/client';

// Singleton pattern - chỉ tạo 1 instance
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error'], // Log queries trong development
  });

// Hot reload không tạo nhiều connections
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### 5.2. CRUD với Prisma

```typescript
// CREATE
const user = await prisma.user.create({
  data: {
    username: 'john',
    email: 'john@example.com',
    passwordHash: 'hashed...',
    roleId: 1,
  },
});

// READ
const users = await prisma.user.findMany({
  where: { status: 'ACTIVE' },
  include: { role: true },       // JOIN với bảng roles
  orderBy: { createdAt: 'desc' },
  skip: 0,                        // Pagination
  take: 10,
});

// READ ONE
const user = await prisma.user.findUnique({
  where: { email: 'john@example.com' },
});

// UPDATE
const updated = await prisma.user.update({
  where: { id: 'user-id-here' },
  data: { fullName: 'John Doe' },
});

// DELETE
await prisma.user.delete({
  where: { id: 'user-id-here' },
});

// TRANSACTION (nhiều operations)
await prisma.$transaction(async (tx) => {
  // Tạo order
  const order = await tx.order.create({ data: {...} });
  
  // Tạo order details
  await tx.orderDetail.createMany({ data: items });
  
  // Xóa cart
  await tx.cart.delete({ where: { userId } });
  
  // Nếu có lỗi → tất cả rollback
});
```

---

## 6. Error Handling

### 6.1. Try-Catch Pattern

```typescript
// Controller
async login(req: Request, res: Response, next: NextFunction) {
  try {
    // Code có thể throw error
    const result = await authService.login(req.body);
    success(res, result);
  } catch (error) {
    // Chuyển error đến middleware
    next(error);
  }
}
```

### 6.2. Custom Error Classes

```typescript
// middleware/errorHandler.ts

// Base Error
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
  }
}

// Specific Errors
export class NotFoundError extends AppError {
  constructor(message = 'Không tìm thấy') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Chưa đăng nhập') {
    super(message, 401);
  }
}

// Usage trong Service
if (!user) {
  throw new NotFoundError('User không tồn tại');
}

if (!isValidPassword) {
  throw new UnauthorizedError('Sai mật khẩu');
}
```

### 6.3. Global Error Handler

```typescript
// Đặt CUỐI CÙNG trong server.ts
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error
  console.error('Error:', err.message);

  // Trả response phù hợp
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Lỗi không mong đợi
  return res.status(500).json({
    success: false,
    message: 'Lỗi server',
  });
});
```

---

## 📚 Tổng kết

### Luồng xử lý hoàn chỉnh:

```
1. Request đến → Express nhận
2. Middleware lần lượt xử lý (cors, json, auth...)
3. Router match endpoint
4. Controller nhận request
5. Controller gọi Service
6. Service thực hiện logic + gọi Prisma
7. Prisma query database
8. Data trả về Service → Controller → Response
9. Nếu có error → Error Handler bắt và trả response lỗi
```

### Tại sao tách thành nhiều layer?

| Lý do | Giải thích |
|-------|------------|
| **Separation of Concerns** | Mỗi layer 1 nhiệm vụ |
| **Dễ test** | Test từng layer riêng |
| **Dễ maintain** | Sửa logic không ảnh hưởng route |
| **Reusable** | Service có thể gọi từ nhiều controller |
