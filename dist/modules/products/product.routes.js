/**
 * =============================================================================
 * PRODUCT.ROUTES.TS - Định nghĩa Routes cho Products
 * =============================================================================
 *
 * File này định nghĩa tất cả API endpoints của Product module
 *
 * ROUTE PATTERN:
 *   router.[method](path, [middlewares...], controller.handler)
 *
 * MIDDLEWARE CHAIN (Admin routes):
 * 1. authenticate → Verify JWT token, gắn user vào req.user
 * 2. authorize('ADMIN') → Check role, reject nếu không phải admin
 * 3. validate(schema) → Validate req.body theo schema
 * 4. controller.handler → Xử lý logic
 *
 * ENDPOINTS OVERVIEW:
 *
 * PUBLIC (không cần login):
 * - GET  /api/products              → List products (PUBLISHED only)
 * - GET  /api/products/detail/:slug → Product detail by slug
 *
 * ADMIN (cần ADMIN role):
 * - GET    /api/products/admin       → List all products (mọi status)
 * - GET    /api/products/admin/:id   → Product detail by ID
 * - POST   /api/products             → Create product
 * - PUT    /api/products/:id         → Update product
 * - DELETE /api/products/:id         → Delete product (soft/hard)
 */
import { Router } from 'express';
import { productController } from './product.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { upload } from '../../middleware/multer.js';
import { createProductSchema, updateProductSchema } from './product.schema.js';
const router = Router();
// ============================================================================
// PUBLIC ROUTES
// ============================================================================
// Ai cũng có thể truy cập, không cần đăng nhập
/**
 * GET /api/products
 * Lấy danh sách sản phẩm (mặc định PUBLISHED only)
 *
 * Query Parameters:
 * - page, limit: Pagination (mặc định page=1, limit=12)
 * - categoryId hoặc categorySlug: Filter by category
 * - minPrice, maxPrice: Price range filter
 * - search: Full-text search
 * - sortBy: createdAt | price | name
 * - sortOrder: asc | desc
 *
 * VÍ DỤ:
 *   /api/products?categorySlug=tra-oolong&minPrice=100000&sortBy=price&sortOrder=asc
 */
router.get('/', productController.getAll);
/**
 * GET /api/products/detail/:slug
 * Lấy chi tiết sản phẩm theo slug
 *
 * Response includes:
 * - Product info + images
 * - 10 reviews gần nhất
 * - Rating statistics (avg, count)
 * - 4 related products
 *
 * VÍ DỤ:
 *   /api/products/detail/tra-oolong-cao-cap
 */
router.get('/detail/:slug', productController.getBySlug);
// ============================================================================
// ADMIN ROUTES
// ============================================================================
// Yêu cầu: Đăng nhập + Role ADMIN
/**
 * GET /api/products/admin
 * Lấy tất cả sản phẩm (không filter status)
 *
 * Dùng trong Admin Panel để quản lý products
 */
router.get('/admin', authenticate, authorize('ADMIN'), productController.getAllAdmin);
/**
 * GET /api/products/admin/:id
 * Lấy chi tiết sản phẩm theo ID
 *
 * Dùng để load data khi edit product
 */
router.get('/admin/:id', authenticate, authorize('ADMIN'), productController.getById);
/**
 * POST /api/products
 * Tạo sản phẩm mới
 *
 * Flow:
 * 1. authenticate → Check token
 * 2. authorize('ADMIN') → Check role
 * 3. validate(createProductSchema) → Validate body
 * 4. productController.create → Process request
 *
 * Body example:
 * {
 *   "name": "Trà Oolong Cao Cấp",
 *   "price": 150000,
 *   "categoryId": "abc123",
 *   "description": "Mô tả chi tiết...",
 *   "images": [{ "url": "https://...", "isThumbnail": true }]
 * }
 */
router.post('/', authenticate, authorize('ADMIN'), upload.array('files', 10), // Parse multipart/form-data, max 10 files
validate(createProductSchema), productController.create);
/**
 * PUT /api/products/:id
 * Cập nhật sản phẩm
 *
 * Hỗ trợ partial update (chỉ gửi fields cần update)
 * Nếu gửi images → replace tất cả images hiện có
 */
router.put('/:id', authenticate, authorize('ADMIN'), upload.array('files', 10), // Parse multipart/form-data, max 10 files
validate(updateProductSchema), productController.update);
/**
 * DELETE /api/products/:id
 * Xóa sản phẩm
 *
 * LOGIC:
 * - Nếu sản phẩm ĐÃ CÓ đơn hàng:
 *   → Soft delete (chuyển status = DISCONTINUED)
 *   → Giữ lại data cho history
 *
 * - Nếu sản phẩm CHƯA CÓ đơn hàng:
 *   → Hard delete (xóa khỏi database)
 *   → Cascade delete images
 */
router.delete('/:id', authenticate, authorize('ADMIN'), productController.delete);
export default router;
//# sourceMappingURL=product.routes.js.map