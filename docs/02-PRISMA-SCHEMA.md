# Bước 2: Prisma Schema - Database Design (Optimized)

## 2.1. Tổng quan Schema

Schema này migrate từ Oracle 19c sang MySQL, bao gồm **14 tables** với các tối ưu:
- ✅ **CUID** thay UUID (tốt hơn cho MySQL indexing)
- ✅ **Enum** thay String (type-safe, tránh lỗi typo)
- ✅ **Indexes** đầy đủ cho performance

| Nhóm | Tables |
|------|--------|
| **User & Auth** | roles, users, user_addresses, sessions |
| **Products** | categories, products, product_images |
| **Commerce** | carts, cart_items, orders, order_details, transactions |
| **Content** | news, reviews |

## 2.2. Schema đầy đủ (Optimized)

Mở `prisma/schema.prisma` và thay toàn bộ:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============================================================
//                          ENUMS
// ============================================================

enum UserStatus {
  ACTIVE
  INACTIVE
  BANNED
}

enum CategoryType {
  PRODUCT
  NEWS
  PAGE
}

enum ProductStatus {
  DRAFT
  PUBLISHED
  HIDDEN
  DISCONTINUED
}

enum OrderStatus {
  PENDING
  CONFIRMED
  SHIPPING
  COMPLETED
  CANCELLED
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
}

enum TransactionStatus {
  PENDING
  SUCCESS
  FAILED
}

enum NewsStatus {
  DRAFT
  PUBLISHED
  HIDDEN
}

// ============================================================
//                    USER & AUTHENTICATION
// ============================================================

model Role {
  id          Int     @id @default(autoincrement())
  name        String  @unique @db.VarChar(50)
  description String? @db.VarChar(255)
  
  users User[]
  
  @@map("roles")
}

model User {
  id           String     @id @default(cuid()) @db.VarChar(30)
  username     String     @unique @db.VarChar(50)
  email        String     @unique @db.VarChar(100)
  passwordHash String     @map("password_hash") @db.VarChar(255)
  fullName     String?    @map("full_name") @db.VarChar(100)
  phone        String?    @unique @db.VarChar(15)
  dateOfBirth  DateTime?  @map("date_of_birth") @db.Date
  status       UserStatus @default(ACTIVE)
  roleId       Int        @map("role_id")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")
  
  role      Role          @relation(fields: [roleId], references: [id])
  sessions  Session[]
  addresses UserAddress[]
  orders    Order[]
  reviews   Review[]
  news      News[]
  carts     Cart[]
  
  @@index([status])
  @@index([roleId])
  @@index([phone])
  @@map("users")
}

model UserAddress {
  id            String   @id @default(cuid()) @db.VarChar(30)
  userId        String   @map("user_id") @db.VarChar(30)
  recipientName String?  @map("recipient_name") @db.VarChar(100)
  phone         String?  @db.VarChar(15)
  address       String   @db.VarChar(500)
  isDefault     Boolean  @default(false) @map("is_default")
  createdAt     DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@map("user_addresses")
}

model Session {
  id               String   @id @default(cuid()) @db.VarChar(30)
  userId           String   @map("user_id") @db.VarChar(30)
  refreshTokenHash String   @unique @map("refresh_token_hash") @db.VarChar(256)
  expiresAt        DateTime @map("expires_at")
  revoked          Boolean  @default(false)
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, revoked])
  @@index([expiresAt])
  @@map("sessions")
}

// ============================================================
//                         PRODUCTS
// ============================================================

model Category {
  id          String       @id @default(cuid()) @db.VarChar(30)
  name        String       @db.VarChar(255)
  slug        String       @unique @db.VarChar(255)
  description String?      @db.VarChar(500)
  parentId    String?      @map("parent_id") @db.VarChar(30)
  isActive    Boolean      @default(true) @map("is_active")
  type        CategoryType @default(PRODUCT)
  
  parent   Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children Category[] @relation("CategoryHierarchy")
  products Product[]
  news     News[]
  
  @@index([type])
  @@index([parentId])
  @@map("categories")
}

model Product {
  id            String        @id @default(cuid()) @db.VarChar(30)
  categoryId    String?       @map("category_id") @db.VarChar(30)
  name          String        @db.VarChar(255)
  slug          String        @unique @db.VarChar(255)
  description   String?       @db.Text
  shortDesc     String?       @map("short_desc") @db.VarChar(500)
  price         Decimal       @db.Decimal(15, 2)
  stockQuantity Int           @default(0) @map("stock_quantity")
  sku           String?       @unique @db.VarChar(50)
  version       Int           @default(0)
  status        ProductStatus @default(DRAFT)
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")
  
  category     Category?      @relation(fields: [categoryId], references: [id])
  images       ProductImage[]
  cartItems    CartItem[]
  orderDetails OrderDetail[]
  reviews      Review[]
  
  @@index([categoryId, status])
  @@index([status, createdAt])
  @@index([price])
  @@map("products")
}

model ProductImage {
  id          String  @id @default(cuid()) @db.VarChar(30)
  productId   String  @map("product_id") @db.VarChar(30)
  imageUrl    String  @map("image_url") @db.VarChar(500)
  isThumbnail Boolean @default(false) @map("is_thumbnail")
  sortOrder   Int     @default(0) @map("sort_order")
  
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId])
  @@map("product_images")
}

// ============================================================
//                      CART & ORDERS
// ============================================================

model Cart {
  id        String     @id @default(cuid()) @db.VarChar(30)
  userId    String?    @unique @map("user_id") @db.VarChar(30)
  createdAt DateTime   @default(now()) @map("created_at")
  updatedAt DateTime   @updatedAt @map("updated_at")
  
  user  User?      @relation(fields: [userId], references: [id])
  items CartItem[]
  
  @@map("carts")
}

model CartItem {
  id        String   @id @default(cuid()) @db.VarChar(30)
  cartId    String   @map("cart_id") @db.VarChar(30)
  productId String   @map("product_id") @db.VarChar(30)
  quantity  Int      @default(1)
  addedAt   DateTime @default(now()) @map("added_at")
  
  cart    Cart    @relation(fields: [cartId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([cartId, productId])
  @@map("cart_items")
}

model Order {
  id              String        @id @default(cuid()) @db.VarChar(30)
  userId          String?       @map("user_id") @db.VarChar(30)
  subtotal        Decimal       @db.Decimal(15, 2)
  shippingFee     Decimal       @default(0) @map("shipping_fee") @db.Decimal(15, 2)
  discountAmount  Decimal       @default(0) @map("discount_amount") @db.Decimal(15, 2)
  totalMoney      Decimal       @map("total_money") @db.Decimal(15, 2)
  status          OrderStatus   @default(PENDING)
  paymentStatus   PaymentStatus @default(UNPAID) @map("payment_status")
  shippingAddress String        @map("shipping_address") @db.VarChar(500)
  shippingPhone   String        @map("shipping_phone") @db.VarChar(20)
  note            String?       @db.VarChar(500)
  createdAt       DateTime      @default(now()) @map("created_at")
  
  user         User?         @relation(fields: [userId], references: [id])
  details      OrderDetail[]
  transactions Transaction[]
  
  @@index([userId, status])
  @@index([status, createdAt])
  @@index([paymentStatus])
  @@map("orders")
}

model OrderDetail {
  id        String  @id @default(cuid()) @db.VarChar(30)
  orderId   String  @map("order_id") @db.VarChar(30)
  productId String  @map("product_id") @db.VarChar(30)
  price     Decimal @db.Decimal(15, 2)
  quantity  Int
  
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
  
  @@index([orderId])
  @@index([productId])
  @@map("order_details")
}

model Transaction {
  id              String            @id @default(cuid()) @db.VarChar(30)
  orderId         String            @map("order_id") @db.VarChar(30)
  paymentMethod   String            @map("payment_method") @db.VarChar(50)
  transactionCode String?           @map("transaction_code") @db.VarChar(100)
  amount          Decimal           @db.Decimal(15, 2)
  status          TransactionStatus @default(PENDING)
  paidAt          DateTime          @default(now()) @map("paid_at")
  description     String?           @db.VarChar(500)
  
  order Order @relation(fields: [orderId], references: [id])
  
  @@index([orderId])
  @@index([status])
  @@map("transactions")
}

// ============================================================
//                         CONTENT
// ============================================================

model News {
  id          String     @id @default(cuid()) @db.VarChar(30)
  categoryId  String?    @map("category_id") @db.VarChar(30)
  authorId    String     @map("author_id") @db.VarChar(30)
  title       String     @db.VarChar(255)
  slug        String     @unique @db.VarChar(255)
  description String?    @db.VarChar(1000)
  content     String?    @db.Text
  imageUrl    String?    @map("image_url") @db.VarChar(500)
  publishedAt DateTime   @default(now()) @map("published_at")
  status      NewsStatus @default(PUBLISHED)
  
  category Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  author   User      @relation(fields: [authorId], references: [id])
  
  @@index([status, publishedAt])
  @@index([categoryId])
  @@index([authorId])
  @@map("news")
}

model Review {
  id          String   @id @default(cuid()) @db.VarChar(30)
  userId      String   @map("user_id") @db.VarChar(30)
  productId   String   @map("product_id") @db.VarChar(30)
  rating      Int      // 1-5, validated at application layer
  commentText String?  @map("comment_text") @db.VarChar(1000)
  createdAt   DateTime @default(now()) @map("created_at")
  
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@unique([userId, productId]) // Mỗi user chỉ review 1 lần
  @@index([productId, rating])
  @@map("reviews")
}
```

## 2.3. So sánh Version Cũ vs Mới

| Tính năng | Cũ (UUID + String) | Mới (CUID + Enum) |
|-----------|-------------------|-------------------|
| **ID** | `@default(uuid()) @db.VarChar(36)` | `@default(cuid()) @db.VarChar(30)` |
| **Status** | `String @default("PENDING")` | `OrderStatus @default(PENDING)` |
| **Indexing** | Random → Page splitting | Time-based → Sequential |
| **Type safety** | Runtime error | Compile-time error |
| **Storage** | 36 chars | 30 chars |

## 2.4. Tại sao CUID tốt hơn UUID?

```
UUID v4 (random):
550e8400-e29b-41d4-a716-446655440000  ← Random, phân mảnh index
f47ac10b-58cc-4372-a567-0e02b2c3d479  ← Random

CUID (time-based):
clh2...abc  ← Tạo trước theo thời gian
clh2...def  ← Tạo sau, sequential
```

→ MySQL B-Tree index hoạt động tốt hơn với CUID!

## 2.5. Push Schema lên Database

```bash
# Tạo database trước (MySQL)
mysql -u root -p -e "CREATE DATABASE teashop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# Push schema
npx prisma db push

# Xem database trong GUI
npx prisma studio
```

## 2.6. Tạo Seed Data

Tạo file `prisma/seed.js`:

```javascript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Roles
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: { name: 'CUSTOMER', description: 'Khách hàng' }
    }),
    prisma.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: { name: 'ADMIN', description: 'Quản trị viên' }
    }),
    prisma.role.upsert({
      where: { name: 'STAFF' },
      update: {},
      create: { name: 'STAFF', description: 'Nhân viên' }
    })
  ]);

  console.log('✅ Roles created');

  // 2. Admin User
  const adminRole = roles.find(r => r.name === 'ADMIN');
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  await prisma.user.upsert({
    where: { email: 'admin@teashop.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@teashop.com',
      passwordHash: hashedPassword,
      fullName: 'Admin System',
      roleId: adminRole.id,
      status: 'ACTIVE' // Enum value - Prisma validates this!
    }
  });

  console.log('✅ Admin user created (admin@teashop.com / 123456)');

  // 3. Categories
  await prisma.category.createMany({
    data: [
      { name: 'Trà Ô Long', slug: 'tra-o-long', description: 'Trà Ô Long cao cấp', type: 'PRODUCT' },
      { name: 'Hồng Trà', slug: 'hong-tra', description: 'Hồng trà đậm đà', type: 'PRODUCT' },
      { name: 'Trà Xanh', slug: 'tra-xanh', description: 'Trà xanh tinh khiết', type: 'PRODUCT' },
      { name: 'Tin tức', slug: 'tin-tuc', description: 'Tin tức về trà', type: 'NEWS' }
    ],
    skipDuplicates: true
  });

  console.log('✅ Categories created');

  // 4. Sample Products
  const category = await prisma.category.findFirst({ where: { slug: 'tra-o-long' } });
  
  if (category) {
    await prisma.product.createMany({
      data: [
        {
          name: 'Trà Ô Long Đài Loan',
          slug: 'tra-o-long-dai-loan',
          description: 'Trà Ô Long nhập khẩu từ Đài Loan, hương thơm đặc trưng.',
          shortDesc: 'Trà Ô Long cao cấp',
          price: 250000,
          stockQuantity: 100,
          status: 'PUBLISHED', // Enum validated!
          categoryId: category.id
        },
        {
          name: 'Trà Ô Long Thiết Quan Âm',
          slug: 'tra-o-long-thiet-quan-am',
          description: 'Thiết Quan Âm - một trong những loại Ô Long nổi tiếng nhất.',
          shortDesc: 'Thiết Quan Âm hảo hạng',
          price: 350000,
          stockQuantity: 50,
          status: 'PUBLISHED',
          categoryId: category.id
        }
      ],
      skipDuplicates: true
    });

    console.log('✅ Sample products created');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch(e => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Chạy seed:

```bash
npm run db:seed
```

---

## 2.7. Indexes được thêm

| Table | Index | Lý do |
|-------|-------|-------|
| `users` | `status`, `roleId`, `phone` | Filter users nhanh |
| `sessions` | `userId + revoked`, `expiresAt` | Cleanup sessions |
| `categories` | `type`, `parentId` | Filter danh mục |
| `products` | `categoryId + status`, `status + createdAt`, `price` | Query sản phẩm |
| `orders` | `userId + status`, `status + createdAt`, `paymentStatus` | Dashboard |
| `reviews` | `@@unique([userId, productId])`, `productId + rating` | 1 review/user, thống kê |
| `news` | `status + publishedAt`, `categoryId`, `authorId` | Query bài viết |

---

## ✅ Checklist Bước 2

- [ ] Đã copy schema vào `prisma/schema.prisma`
- [ ] Đã tạo database MySQL `teashop_db`
- [ ] Đã chạy `npx prisma db push`
- [ ] Đã tạo file `prisma/seed.js`
- [ ] Đã chạy `npm run db:seed`
- [ ] Đã kiểm tra data bằng `npx prisma studio`

---

**Tiếp theo:** [03-AUTH-MODULE.md](./03-AUTH-MODULE.md)
