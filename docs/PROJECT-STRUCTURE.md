# Cấu Trúc Thư Mục Backend2 - Tối Ưu

> Express.js + Prisma ORM + MySQL

## 📁 Cấu Trúc Tổng Quan

```
backend2/
├── 📄 package.json           # Dependencies & scripts
├── 📄 .env                   # Environment variables (KHÔNG commit)
├── 📄 .env.example           # Template env cho team
├── 📄 .gitignore             # Ignore node_modules, .env, logs
├── 📄 README.md              # Hướng dẫn setup
│
├── 📂 prisma/                # Database layer
│   ├── schema.prisma         # Schema definition
│   └── seed.js               # Dữ liệu mẫu
│
├── 📂 src/                   # Source code chính
│   ├── 📄 server.js          # Entry point
│   │
│   ├── 📂 config/            # Cấu hình app
│   │   ├── database.js       # Prisma config
│   │   ├── cloudinary.js     # Cloudinary config
│   │   └── constants.js      # App constants
│   │
│   ├── 📂 middleware/        # Express middleware
│   │   ├── auth.js           # JWT authenticate
│   │   ├── authorize.js      # Role-based access
│   │   ├── validate.js       # Joi validation
│   │   ├── upload.js         # Multer config
│   │   ├── rateLimiter.js    # Rate limiting
│   │   └── errorHandler.js   # Error handling
│   │
│   ├── 📂 utils/             # Helper functions
│   │   ├── response.js       # Response formatter
│   │   ├── pagination.js     # Pagination helper
│   │   ├── slug.js           # Slug generator
│   │   └── logger.js         # Winston logger
│   │
│   ├── 📂 validations/       # Joi schemas (shared)
│   │   ├── auth.schema.js
│   │   ├── user.schema.js
│   │   ├── product.schema.js
│   │   └── order.schema.js
│   │
│   └── 📂 modules/           # Feature modules
│       ├── 📂 auth/
│       ├── 📂 users/
│       ├── 📂 categories/
│       ├── 📂 products/
│       ├── 📂 cart/
│       ├── 📂 orders/
│       ├── 📂 reviews/
│       ├── 📂 news/
│       ├── 📂 uploads/
│       └── 📂 dashboard/
│
├── 📂 docs/                  # Documentation
│   ├── 01-SETUP.md
│   ├── 02-PRISMA-SCHEMA.md
│   └── ...
│
├── 📂 mocks/                 # Mock data cho testing
│   ├── auth/
│   ├── users/
│   └── ...
│
├── 📂 logs/                  # Log files (KHÔNG commit)
│   ├── error.log
│   └── combined.log
│
└── 📂 uploads/               # Local uploads (dev only)
    └── temp/
```

---

## 📋 Chi Tiết Từng Thư Mục

### 📂 `prisma/` - Database Layer

| File | Nhiệm Vụ |
|------|----------|
| `schema.prisma` | Định nghĩa models, relations, indexes. Là "nguồn sự thật" cho database |
| `seed.js` | Tạo dữ liệu mẫu (roles, admin user, categories). Chạy bằng `npm run db:seed` |

```bash
# Commands
npx prisma db push      # Sync schema → DB
npx prisma generate     # Generate Prisma Client
npx prisma studio       # GUI xem database
npm run db:seed         # Seed data
```

---

### 📂 `src/config/` - Cấu Hình App

| File | Nhiệm Vụ |
|------|----------|
| `database.js` | Kết nối Prisma Client (singleton pattern) |
| `cloudinary.js` | Cấu hình Cloudinary SDK |
| `constants.js` | Hằng số dùng chung: JWT_EXPIRES, ROLES, ORDER_STATUS... |

```javascript
// config/database.js
import { PrismaClient } from '@prisma/client';
const prisma = globalThis.prisma ?? new PrismaClient();
export default prisma;
```

---

### 📂 `src/middleware/` - Express Middleware

| File | Nhiệm Vụ | Sử Dụng |
|------|----------|---------|
| `auth.js` | Xác thực JWT từ header | `authenticate` - yêu cầu login |
| `authorize.js` | Kiểm tra quyền role | `authorize('ADMIN')` - chỉ admin |
| `validate.js` | Validate request body | `validate(schema)` - kiểm tra input |
| `upload.js` | Xử lý file upload | `upload.single('image')` |
| `rateLimiter.js` | Giới hạn request | Chống spam, brute-force |
| `errorHandler.js` | Xử lý lỗi tập trung | Convert lỗi thành JSON response |

```javascript
// Ví dụ sử dụng
router.post('/admin/products',
  authenticate,           // 1. Phải login
  authorize('ADMIN'),     // 2. Phải là admin
  validate(productSchema),// 3. Validate body
  controller.create       // 4. Xử lý business
);
```

---

### 📂 `src/utils/` - Helper Functions

| File | Nhiệm Vụ |
|------|----------|
| `response.js` | Format response thống nhất: `success(res, data)`, `error(res, message)` |
| `pagination.js` | Tính toán `skip`, `take`, format pagination object |
| `slug.js` | Tạo slug từ tiếng Việt: `"Trà Ô Long"` → `"tra-o-long"` |
| `logger.js` | Winston logger với file rotation |

```javascript
// utils/response.js
export const success = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

export const error = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ success: false, message });
};
```

---

### 📂 `src/validations/` - Joi Schemas

| File | Nhiệm Vụ |
|------|----------|
| `auth.schema.js` | Validate login, register, refresh token |
| `user.schema.js` | Validate profile update, password change |
| `product.schema.js` | Validate create/update product |
| `order.schema.js` | Validate checkout, update status |

```javascript
// validations/product.schema.js
export const createProduct = Joi.object({
  name: Joi.string().required().min(3).max(255),
  price: Joi.number().required().min(0),
  categoryId: Joi.string().uuid().required(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'HIDDEN')
});
```

---

### 📂 `src/modules/` - Feature Modules

Mỗi module có cấu trúc giống nhau:

```
modules/
└── products/
    ├── product.routes.js      # Route definitions
    ├── product.controller.js  # Request handlers
    ├── product.service.js     # Business logic
    └── product.validation.js  # (optional) Module-specific validation
```

| Layer | Nhiệm Vụ | Ví Dụ |
|-------|----------|-------|
| **routes.js** | Định nghĩa endpoints, gắn middleware | `router.get('/', controller.list)` |
| **controller.js** | Nhận request, gọi service, trả response | Parse params, call service, return JSON |
| **service.js** | Business logic, gọi Prisma | Query DB, xử lý logic, throw errors |

```javascript
// Luồng xử lý request
// 1. Route nhận request → 2. Middleware validate → 3. Controller parse → 4. Service xử lý → 5. Response
```

---

### 📂 Module Structure Chi Tiết

```
modules/
├── auth/           # Đăng nhập, đăng ký, refresh token, logout
├── users/          # Quản lý user, profile, addresses
├── categories/     # CRUD danh mục (tree structure)
├── products/       # CRUD sản phẩm, images, filtering
├── cart/           # Quản lý giỏ hàng
├── orders/         # Checkout, order history, admin management
├── reviews/        # Đánh giá sản phẩm
├── news/           # Blog/tin tức (CMS)
├── uploads/        # Upload images → Cloudinary
└── dashboard/      # Analytics cho admin
```

---

### 📂 `docs/` - Documentation

| File | Nội Dung |
|------|----------|
| `01-SETUP.md` | Khởi tạo project, cài dependencies |
| `02-PRISMA-SCHEMA.md` | Database design, seed data |
| `03-AUTH-MODULE.md` | JWT authentication flow |
| `04-USERS-MODULE.md` | User management APIs |
| `...` | Các module khác |
| `DATABASE-EVALUATION.md` | Đánh giá hiệu năng, bảo mật |

---

### 📂 `mocks/` - Test Data

| Folder | Chứa |
|--------|------|
| `auth/` | Mock cho register, login, tokens |
| `users/` | Mock cho user CRUD, addresses |
| `products/` | Mock cho product APIs |
| `...` | Các module khác |

Mỗi file mock bao gồm:
- ✅ **Success cases** - Request/response thành công
- ❌ **Error cases** - Các lỗi validation, not found
- 🔒 **Auth cases** - 401, 403 errors

---

## 🔄 Luồng Request Điển Hình

```
┌──────────────────────────────────────────────────────────────────┐
│                           CLIENT                                 │
│                    POST /api/products                            │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                         server.js                                │
│  - CORS, JSON parser, Cookie parser                              │
│  - Rate Limiter                                                  │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                    product.routes.js                             │
│  router.post('/',                                                │
│    authenticate,      ← Kiểm tra JWT                             │
│    authorize('ADMIN'),← Kiểm tra role                            │
│    validate(schema),  ← Validate body                            │
│    controller.create  ← Handler                                  │
│  )                                                               │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  product.controller.js                           │
│  async create(req, res) {                                        │
│    const data = req.body;                                        │
│    const result = await productService.create(data);             │
│    return success(res, result, 201);                             │
│  }                                                               │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                   product.service.js                             │
│  async create(data) {                                            │
│    return prisma.$transaction(async (tx) => {                    │
│      const product = await tx.product.create({...});             │
│      await tx.productImage.createMany({...});                    │
│      return product;                                             │
│    });                                                           │
│  }                                                               │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Prisma Client                              │
│                          ↓                                       │
│                      MySQL Database                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📝 Naming Conventions

| Loại | Convention | Ví Dụ |
|------|------------|-------|
| Folder | kebab-case | `user-addresses/` |
| File | camelCase hoặc kebab | `product.service.js` |
| Route | kebab-case | `/api/user-addresses` |
| Prisma Model | PascalCase | `ProductImage` |
| DB Table | snake_case | `product_images` |
| Environment | UPPER_SNAKE | `DATABASE_URL` |

---

## ⚡ Quick Commands

```bash
# Development
npm run dev           # Start với nodemon

# Database
npm run db:push       # Sync schema
npm run db:seed       # Seed data
npm run db:studio     # Open Prisma Studio

# Production
npm run build         # (if using TypeScript)
npm start             # Start production
```
