# 🚀 Backend2 Setup - Hướng Dẫn Từng Bước

> Express.js + Prisma ORM + MySQL

## Yêu cầu trước khi bắt đầu

- [x] Node.js v18+ (`node -v`)
- [x] MySQL Server 8.0+ đang chạy
- [x] VS Code hoặc Editor bất kỳ

---

## 📋 BƯỚC 1: Tạo thư mục và khởi tạo project

```bash
# Di chuyển vào thư mục WEB_TRA_ORACLE
cd d:\Manhinh\CODE_ANTI\WEB_TRA_ORACLE

# Tạo thư mục backend2
mkdir backend2
cd backend2

# Khởi tạo package.json
npm init -y
```

---

## 📋 BƯỚC 2: Cấu hình package.json

Mở file `package.json` và **thay toàn bộ** bằng:

```json
{
  "name": "backend2",
  "version": "1.0.0",
  "description": "E-commerce API with Prisma + MySQL",
  "main": "src/server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/server.js",
    "start": "node src/server.js",
    "db:push": "npx prisma db push",
    "db:generate": "npx prisma generate",
    "db:seed": "node prisma/seed.js",
    "db:studio": "npx prisma studio"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

---

## 📋 BƯỚC 3: Cài đặt Dependencies

```bash
# Dependencies chính
npm install express cors dotenv cookie-parser

# Prisma ORM
npm install @prisma/client
npm install prisma --save-dev

# Authentication
npm install bcryptjs jsonwebtoken

# Validation
npm install joi slugify

# File upload
npm install multer cloudinary

# Utilities
npm install winston express-rate-limit

# Development
npm install nodemon --save-dev
```

**Hoặc chạy 1 lệnh:**

```bash
npm install express cors dotenv cookie-parser @prisma/client bcryptjs jsonwebtoken joi slugify multer cloudinary winston express-rate-limit

npm install prisma nodemon --save-dev
```

---

## 📋 BƯỚC 4: Tạo cấu trúc thư mục

```bash
# Tạo thư mục chính
mkdir src
mkdir src\config
mkdir src\middleware
mkdir src\utils
mkdir src\validations
mkdir src\modules
mkdir src\modules\auth
mkdir src\modules\users
mkdir src\modules\categories
mkdir src\modules\products
mkdir src\modules\cart
mkdir src\modules\orders
mkdir src\modules\reviews
mkdir src\modules\news
mkdir src\modules\uploads
mkdir src\modules\dashboard
mkdir prisma
mkdir logs
mkdir uploads
mkdir uploads\temp
```

---

## 📋 BƯỚC 5: Tạo file .env

Tạo file `.env` trong thư mục root:

```env
# Server
PORT=5001
NODE_ENV=development

# Database - MySQL (SỬA THÔNG TIN CỦA BẠN)
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/teashop_db"

# JWT Secrets (chạy lệnh dưới để generate)
ACCESS_TOKEN_SECRET=your_access_token_secret_here_64_chars
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here_64_chars

# Cloudinary (đăng ký tại cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

**Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Chạy 2 lần và copy vào `ACCESS_TOKEN_SECRET` và `REFRESH_TOKEN_SECRET`.

---

## 📋 BƯỚC 6: Khởi tạo Prisma

```bash
npx prisma init
```

Lệnh này tạo:
- `prisma/schema.prisma`
- `.env` (nếu chưa có)

---

## 📋 BƯỚC 7: Cấu hình Prisma Schema

Mở file `prisma/schema.prisma` và copy toàn bộ schema từ:
📄 [docs/02-PRISMA-SCHEMA.md](./docs/02-PRISMA-SCHEMA.md)

*(Phần 2.2 - Schema đầy đủ Optimized)*

---

## 📋 BƯỚC 8: Tạo Database MySQL

Mở MySQL Workbench hoặc terminal:

```sql
CREATE DATABASE teashop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Hoặc dùng command line:
```bash
mysql -u root -p -e "CREATE DATABASE teashop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
```

---

## 📋 BƯỚC 9: Push Schema lên Database

```bash
npx prisma db push
```

Output thành công:
```
🚀  Your database is now in sync with your Prisma schema.
```

---

## 📋 BƯỚC 10: Tạo Seed Data

Tạo file `prisma/seed.js` và copy nội dung từ:
📄 [docs/02-PRISMA-SCHEMA.md](./docs/02-PRISMA-SCHEMA.md) - Phần 2.6

Sau đó chạy:
```bash
npm run db:seed
```

Output:
```
🌱 Seeding database...
✅ Roles created
✅ Admin user created (admin@teashop.com / 123456)
✅ Categories created
✅ Sample products created
🎉 Seeding completed!
```

---

## 📋 BƯỚC 11: Kiểm tra Database

```bash
npm run db:studio
```

Mở browser tại `http://localhost:5555` để xem data.

---

## 📋 BƯỚC 12: Tạo file cấu hình cơ bản

### 12.1. `src/config/database.js`

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

### 12.2. `src/utils/response.js`

```javascript
export const success = (res, data, statusCode = 200) => {
  res.status(statusCode).json({ success: true, data });
};

export const error = (res, message, statusCode = 400) => {
  res.status(statusCode).json({ success: false, message });
};
```

### 12.3. `src/server.js`

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import prisma from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// TODO: Add routes here
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// ...

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
```

---

## 📋 BƯỚC 13: Chạy thử Server

```bash
npm run dev
```

Output thành công:
```
✅ Database connected
🚀 Server running on http://localhost:5001
```

---

## 📋 BƯỚC 14: Test API

Mở browser hoặc Postman:

```
GET http://localhost:5001/api/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-01-30T09:00:00.000Z"
}
```

---

## ✅ Hoàn Thành Setup!

### Tiếp theo là implement các modules:

1. 📄 [03-AUTH-MODULE.md](./docs/03-AUTH-MODULE.md) - Authentication
2. 📄 [04-USERS-MODULE.md](./docs/04-USERS-MODULE.md) - User management
3. 📄 [05-CATEGORIES-MODULE.md](./docs/05-CATEGORIES-MODULE.md) - Categories
4. ... (tiếp tục theo thứ tự)

### Commands thường dùng:

```bash
npm run dev        # Chạy development server
npm run db:push    # Sync schema → database
npm run db:seed    # Seed data mẫu
npm run db:studio  # Xem database GUI
```
