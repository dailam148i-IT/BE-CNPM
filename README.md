# 🚀 Backend Prisma + MySQL - Hướng Dẫn Xây Dựng

> E-commerce API cho Trà Ô Long & Sản phẩm Hữu Cơ

## 📁 Cấu Trúc Documentation

```
docs/
├── 01-SETUP.md            # Khởi tạo project
├── 02-PRISMA-SCHEMA.md    # Database schema đầy đủ
├── 03-AUTH-MODULE.md      # Authentication (JWT, Sessions)
├── 04-USERS-MODULE.md     # User management
├── 05-CATEGORIES-MODULE.md # Categories CRUD
├── 06-PRODUCTS-MODULE.md  # Products CRUD
├── 07-CART-ORDERS.md      # Cart & Orders
├── 08-REVIEWS-MODULE.md   # Reviews & Ratings
├── 09-NEWS-MODULE.md      # News/Blog
├── 10-UPLOADS-MODULE.md   # File uploads (Cloudinary)
├── 11-DASHBOARD-MODULE.md # Analytics API
└── 12-MIDDLEWARE.md       # Auth, Validation, Error handling
```

## 🎯 Lộ Trình Học Tập

| Giai đoạn | Nội dung | Thời gian |
|-----------|----------|-----------|
| **1. Foundation** | Setup, Schema, Database | 1-2 ngày |
| **2. Core Auth** | Auth, Users, Middleware | 2-3 ngày |
| **3. Products** | Categories, Products, Uploads | 2-3 ngày |
| **4. Commerce** | Cart, Orders, Transactions | 2-3 ngày |
| **5. Content** | Reviews, News, Dashboard | 1-2 ngày |

## ⚡ Quick Start

```bash
# 1. Cài đặt dependencies
npm install

# 2. Tạo database MySQL
mysql -u root -p -e "CREATE DATABASE teashop_db"

# 3. Cấu hình .env
cp .env.example .env

# 4. Push schema & seed
npm run db:push
npm run db:seed

# 5. Chạy server
npm run dev
```

## 📚 Đọc docs theo thứ tự

**Bắt đầu từ:** [01-SETUP.md](./docs/01-SETUP.md)
