# Bước 12: Middleware & Utilities

## 12.1. Prisma Client Singleton

Tạo `src/database/prisma.js`:

```javascript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
```

---

## 12.2. Auth Middleware

Tạo `src/middleware/auth.middleware.js`:

```javascript
import jwt from 'jsonwebtoken';

/**
 * Xác thực JWT Token
 */
export function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Vui lòng đăng nhập'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    req.user = decoded; // { userId, role }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
}

/**
 * Kiểm tra quyền truy cập
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền truy cập'
      });
    }

    next();
  };
}
```

---

## 12.3. Validation Middleware

Tạo `src/middleware/validate.middleware.js`:

```javascript
/**
 * Validate request body với Joi schema
 */
export function validate(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Trả về tất cả lỗi
      stripUnknown: true // Loại bỏ các field không định nghĩa
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors
      });
    }

    req.body = value; // Sử dụng giá trị đã được validate
    next();
  };
}

/**
 * Validate query params
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Query params không hợp lệ',
        errors: error.details.map(d => d.message)
      });
    }

    req.query = value;
    next();
  };
}
```

---

## 12.4. Error Handler

Tạo `src/middleware/errorHandler.js`:

```javascript
/**
 * Global Error Handler
 */
export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', err);

  // Prisma Errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đã tồn tại (trùng lặp)',
          field: err.meta?.target
        });
      
      case 'P2025':
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy dữ liệu'
        });
      
      case 'P2003':
        return res.status(400).json({
          success: false,
          message: 'Không thể thực hiện do ràng buộc dữ liệu'
        });
    }
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn',
      code: 'TOKEN_EXPIRED'
    });
  }

  // Multer Errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File quá lớn (tối đa 5MB)'
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'Vượt quá số lượng file cho phép'
    });
  }

  // Default Error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

---

## 12.5. Rate Limiter

Tạo `src/middleware/rateLimiter.js`:

```javascript
import rateLimit from 'express-rate-limit';

/**
 * Rate limiter cho API chung
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // 100 requests / 15 phút
  message: {
    success: false,
    message: 'Quá nhiều request, vui lòng thử lại sau'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter cho Auth (chống brute force)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 lần đăng nhập sai / 15 phút
  message: {
    success: false,
    message: 'Quá nhiều lần thử, vui lòng đợi 15 phút'
  }
});
```

---

## 12.6. Server Entry Point

Tạo `src/server.js`:

```javascript
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prisma from './database/prisma.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter, authLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import productRoutes from './modules/products/product.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import newsRoutes from './modules/news/news.routes.js';
import uploadRoutes from './modules/uploads/upload.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// ============ MIDDLEWARE ============
app.use(cors({
  origin: [
    'http://localhost:3000',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============ ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.url} not found`
  });
});

// Error handler (PHẢI ĐẶT CUỐI CÙNG)
app.use(errorHandler);

// ============ START SERVER ============
prisma.$connect()
  .then(() => {
    console.log('✅ Database connected via Prisma');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing server...');
  await prisma.$disconnect();
  process.exit(0);
});
```

---

## ✅ Checklist Bước 12

- [ ] Đã tạo `src/database/prisma.js`
- [ ] Đã tạo `src/middleware/auth.middleware.js`
- [ ] Đã tạo `src/middleware/validate.middleware.js`
- [ ] Đã tạo `src/middleware/errorHandler.js`
- [ ] Đã tạo `src/middleware/rateLimiter.js`
- [ ] Đã tạo `src/server.js`
- [ ] Chạy `npm run dev` thành công

---

## 🎉 Hoàn Thành!

Bạn đã hoàn thành việc xây dựng backend với Prisma + MySQL!

### Các lệnh quan trọng:

```bash
# Development
npm run dev

# Database
npm run db:push      # Push schema changes
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed data

# Production
npm run db:migrate   # Create migrations
npm start
```

### Test API

```bash
# Health check
curl http://localhost:5001/api/health

# Register
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","fullName":"Test"}'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teashop.com","password":"123456"}'
```
