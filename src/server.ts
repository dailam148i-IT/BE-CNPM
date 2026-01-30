/**
 * =============================================================================
 * SERVER.TS - Entry Point của ứng dụng
 * =============================================================================
 * 
 * File này là điểm khởi đầu của server Express.
 * 
 * NHIỆM VỤ:
 * 1. Load environment variables
 * 2. Khởi tạo Express app
 * 3. Cấu hình middleware
 * 4. Định nghĩa routes
 * 5. Xử lý errors
 * 6. Khởi động server
 * 
 * THỨ TỰ MIDDLEWARE (RẤT QUAN TRỌNG):
 * 1. cors() → Kiểm tra nguồn request
 * 2. express.json() → Parse body JSON
 * 3. cookieParser() → Parse cookies
 * 4. rateLimit() → Giới hạn requests
 * 5. Routes → Xử lý business logic
 * 6. 404 Handler → Xử lý route không tồn tại
 * 7. Error Handler → Xử lý tất cả errors (CUỐI CÙNG)
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';

// Import các modules tự tạo
import prisma from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { success } from './utils/response.js';

// Import Routes
import authRoutes from './modules/auth/auth.routes.js';

/**
 * Load biến môi trường từ file .env
 * Phải gọi TRƯỚC khi sử dụng process.env
 * 
 * Ví dụ .env:
 *   PORT=5001
 *   DATABASE_URL="mysql://..."
 *   JWT_SECRET="..."
 */
dotenv.config();

/**
 * Khởi tạo Express application
 * app là object chính để:
 * - Thêm middleware: app.use()
 * - Định nghĩa routes: app.get(), app.post()
 * - Khởi động server: app.listen()
 */
const app = express();

/**
 * PORT server sẽ chạy
 * Ưu tiên dùng từ .env, nếu không có thì dùng 5001
 */
const PORT = process.env.PORT || 5001;

// =============================================================================
//                               MIDDLEWARE
// =============================================================================

/**
 * 1. CORS (Cross-Origin Resource Sharing)
 * 
 * Vấn đề: Browser chặn request từ domain khác (security)
 * Ví dụ: Frontend localhost:3000 gọi API localhost:5001 → bị chặn
 * 
 * Giải pháp: Server phải cho phép origin cụ thể
 * 
 * Options:
 * - origin: Domain được phép (từ .env hoặc localhost:3000)
 * - credentials: Cho phép gửi cookies
 */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

/**
 * 2. PARSE JSON BODY
 * 
 * Khi client gửi JSON trong body, Express cần parse thành object
 * 
 * Trước: req.body = undefined
 * Sau:   req.body = { email: "...", password: "..." }
 * 
 * limit: Giới hạn kích thước body (bảo vệ server)
 */
app.use(express.json({ limit: '10mb' }));

/**
 * 3. PARSE URL-ENCODED BODY
 * 
 * Dùng cho form HTML truyền thống (không phải JSON)
 * Content-Type: application/x-www-form-urlencoded
 * 
 * extended: true → cho phép nested objects
 */
app.use(express.urlencoded({ extended: true }));

/**
 * 4. PARSE COOKIES
 * 
 * Cookies được gửi trong header, cần parse thành object
 * 
 * Trước: req.cookies = undefined
 * Sau:   req.cookies = { refreshToken: "..." }
 */
app.use(cookieParser());

/**
 * 5. RATE LIMITING
 * 
 * Bảo vệ server khỏi:
 * - Brute force attacks (thử password liên tục)
 * - DDoS (quá nhiều requests)
 * 
 * windowMs: Khoảng thời gian theo dõi (15 phút)
 * max: Số request tối đa trong window
 * message: Response khi vượt limit
 * 
 * Chỉ áp dụng cho routes bắt đầu bằng /api/
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút = 900,000 ms
  max: 100, // 100 requests / 15 phút
  message: { 
    success: false, 
    message: 'Too many requests, please try again later' 
  },
});
app.use('/api/', limiter);

// =============================================================================
//                                 ROUTES
// =============================================================================

/**
 * HEALTH CHECK ENDPOINT
 * 
 * Dùng để kiểm tra server có đang chạy không
 * Thường được monitoring tools gọi định kỳ
 * 
 * Response:
 * - status: "OK"
 * - timestamp: Thời gian hiện tại
 * - uptime: Thời gian server đã chạy (seconds)
 */
app.get('/api/health', (_req: Request, res: Response) => {
  success(res, {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * DATABASE HEALTH CHECK
 * 
 * Kiểm tra kết nối database
 * Gửi query đơn giản (SELECT 1) để test connection
 */
app.get('/api/health/db', async (_req: Request, res: Response) => {
  try {
    // $queryRaw: Chạy raw SQL query
    await prisma.$queryRaw`SELECT 1`;
    success(res, { database: 'Connected' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }
});

/**
 * API ROUTES
 * 
 * Cấu trúc: app.use('/api/[resource]', [router])
 * 
 * Mỗi module có router riêng được import và đăng ký ở đây
 */
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/categories', categoryRoutes);
// app.use('/api/products', productRoutes);
// app.use('/api/cart', cartRoutes);
// app.use('/api/orders', orderRoutes);
// app.use('/api/reviews', reviewRoutes);
// app.use('/api/news', newsRoutes);
// app.use('/api/uploads', uploadRoutes);
// app.use('/api/dashboard', dashboardRoutes);

/**
 * 404 HANDLER
 * 
 * Xử lý khi không có route nào match
 * PHẢI đặt SAU tất cả routes
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

/**
 * ERROR HANDLER
 * 
 * Middleware đặc biệt với 4 parameters (err, req, res, next)
 * Bắt tất cả errors từ các routes và trả response phù hợp
 * 
 * PHẢI đặt CUỐI CÙNG
 */
app.use(errorHandler);

// =============================================================================
//                            START SERVER
// =============================================================================

/**
 * Hàm khởi động server
 * 
 * Async function để có thể await các operations:
 * 1. Kết nối database
 * 2. Khởi động HTTP server
 */
const startServer = async (): Promise<void> => {
  try {
    // 1. Test kết nối database
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // 2. Khởi động HTTP server
    // app.listen() tạo HTTP server và bắt đầu lắng nghe requests
    app.listen(PORT, () => {
      console.log('');
      console.log('🚀 Server is running!');
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   Health:  http://localhost:${PORT}/api/health`);
      console.log('');
    });
  } catch (error) {
    // Nếu không kết nối được DB hoặc lỗi khởi động
    console.error('❌ Failed to start server:', error);
    process.exit(1); // Exit với code 1 = error
  }
};

// =============================================================================
//                          GRACEFUL SHUTDOWN
// =============================================================================

/**
 * SIGINT: Signal khi nhấn Ctrl+C trong terminal
 * SIGTERM: Signal khi process bị kill (trong production)
 * 
 * Graceful shutdown:
 * 1. Ngừng nhận requests mới
 * 2. Đợi requests đang xử lý hoàn thành
 * 3. Đóng kết nối database
 * 4. Exit process
 * 
 * Tại sao cần?
 * - Đảm bảo không mất data
 * - Đóng connections đúng cách
 * - Tránh corrupt database
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0); // Exit với code 0 = success
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Gọi hàm khởi động server
startServer();
