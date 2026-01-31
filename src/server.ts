/**
 * =============================================================================
 * SERVER.TS - Entry Point của ứng dụng Backend
 * =============================================================================
 * 
 * Đây là "Bộ não" trung tâm của Backend.
 * Nó chịu trách nhiệm khởi tạo server, kết nối Database, và điều phối Request.
 * 
 * 🏗️ KIẾN TRÚC SERVER (REQUEST FLOW):
 * 
 *    [CLIENT] (React/Mobile)
 *       ⬇️
 *    [SERVER.TS] (Express App)
 *       ⬇️
 *    1. Middleware Global (Chạy cho TẤT CẢ request)
 *       |-- CORS (Cho phép ai gọi?)
 *       |-- Body Parser (Đọc JSON/Form)
 *       |-- Logger (Ghi log)
 *       ⬇️
 *    2. Rate Limiting (Chống spam/DDoS)
 *       ⬇️
 *    3. Routes (Bộ định tuyến)
 *       |-- /api/auth   ----> auth.routes.ts   ----> auth.controller.ts
 *       |-- /api/admin  ----> admin.routes.ts  ----> admin.controller.ts
 *       |-- ...
 *       ⬇️
 *    4. Controllers (Xử lý logic)
 *       ⬇️
 *    5. Services (Business Logic & Database)
 *       |-- Prisma Client ----> [DATABASE] (MySQL)
 * 
 * =============================================================================
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module: Node.js mới dùng import/export thay vì require()
// Cần trick này để lấy __dirname (đường dẫn folder hiện tại)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import các modules tự tạo
import prisma from './config/database.js'; // Kết nối Database
import { errorHandler } from './middleware/errorHandler.js'; // Xử lý lỗi tập trung
import { success } from './utils/response.js'; // Format response chuẩn

// Import Routes (Các nhóm API)
import authRoutes from './modules/auth/auth.routes.js';
import categoryRoutes from './modules/categories/category.routes.js';
import productRoutes from './modules/products/product.routes.js';
import cartRoutes from './modules/cart/cart.routes.js';
import orderRoutes from './modules/orders/order.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import reviewRoutes from './modules/reviews/review.routes.js';
import newsRoutes from './modules/news/news.routes.js';
import userRoutes from './modules/users/user.routes.js';
import uploadRoutes from './modules/uploads/upload.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import sseRoutes from './modules/sse/sse.routes.js';
import paymentRoutes from './modules/payment/payment.routes.js';

/**
 * 1. CONFIGURATION
 * Load biến môi trường từ file .env vào process.env
 */
dotenv.config();

/**
 * 2. INITIALIZATION
 * Khởi tạo Express app - object chính quản lý toàn bộ server
 */
const app = express();
const PORT = process.env.PORT || 5001;

// =============================================================================
// 3. MIDDLEWARE SETUP (Các lớp xử lý trung gian)
// =============================================================================

/**
 * CORS (Cross-Origin Resource Sharing)
 * Cho phép Frontend (localhost:3000) gọi API của Backend (localhost:5001)
 * credentials: true -> Cho phép gửi Cookies (quan trọng cho Refresh Token)
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

/**
 * Body Parsers
 * Giúp Server đọc được dữ liệu Client gửi lên
 */
app.use(express.json({ limit: '10mb' })); // Đọc JSON body
app.use(express.urlencoded({ extended: true })); // Đọc Form data
app.use(cookieParser()); // Đọc Cookies từ header

/**
 * Static Files
 * Mở thư mục uploads ra public để Client tải được ảnh
 * http://localhost:5001/uploads/image.jpg
 */
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

/**
 * Rate Limiting (Bảo mật)
 * Giới hạn số lượng request từ 1 IP để chống Spam/DDoS
 * Cấu hình: 100 requests / 15 phút
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later' },
});
// app.use('/api/', limiter); // Chỉ áp dụng cho các API routes

// =============================================================================
// 4. ROUTE DEFINITIONS (Định nghĩa các đường dẫn)
// =============================================================================

/**
 * Health Check API
 * Để monitoring tools (hoặc developer) kiểm tra server còn sống không
 */
app.get('/api/health', (_req: Request, res: Response) => {
  success(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/api/health/db', async (_req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`; // Test query nhẹ nhất có thể
    success(res, { database: 'Connected' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Database connection failed' });
  }
});

/**
 * Module Routes
 * Gắn các router con vào đường dẫn cha
 */
app.use('/api/auth', authRoutes);           // Đăng ký, Đăng nhập, Refresh Token
app.use('/api/categories', categoryRoutes); // Quản lý danh mục
app.use('/api/products', productRoutes);    // Quản lý sản phẩm
app.use('/api/cart', cartRoutes);           // Giỏ hàng
app.use('/api/orders', orderRoutes);        // Đơn hàng
app.use('/api/admin', adminRoutes);         // Dashboard, Stats (Admin only)
app.use('/api', reviewRoutes);              // Đánh giá sản phẩm
app.use('/api/admin', userRoutes);          // Quản lý Users (Admin only)
app.use('/api', newsRoutes);                // Tin tức
app.use('/api/uploads', uploadRoutes);      // Upload ảnh
app.use('/api/payment', paymentRoutes);     // Thanh toán SePay
app.use('/api/notifications', notificationRoutes); // Thông báo
app.use('/api/sse', sseRoutes);             // Server-Sent Events

/**
 * 404 Handler
 * Nếu request không khớp route nào ở trên -> Trả về lỗi 404
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

/**
 * Global Error Handler
 * Nơi tập trung xử lý TẤT CẢ lỗi của ứng dụng
 * Giúp response lỗi luôn chuẩn format JSON, không bị crash server
 */
app.use(errorHandler);

// =============================================================================
// 5. SERVER STARTUP (Khởi động)
// =============================================================================

const startServer = async (): Promise<void> => {
  try {
    // Bước 1: Kết nối Database trước
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Bước 2: Mở port lắng nghe request
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Server is running!');
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   Health:  http://localhost:${PORT}/api/health`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Tắt process với mã lỗi 1
  }
};

// =============================================================================
// GRACEFUL SHUTDOWN (Tắt server an toàn)
// =============================================================================
// Xử lý khi bấm Ctrl+C hoặc server bị kill -> Đóng kết nối DB đàng hoàng

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Chạy hàm khởi động
startServer();
