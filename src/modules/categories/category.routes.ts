/**
 * =============================================================================
 * CATEGORY.ROUTES.TS - Định nghĩa Routes cho Categories
 * =============================================================================
 * 
 * File này định nghĩa tất cả API endpoints của Category module
 * 
 * ROUTE STRUCTURE:
 *   router.[method](path, [middlewares...], handler)
 * 
 * MIDDLEWARE ORDER:
 * 1. authenticate - Kiểm tra JWT token (ai đang request)
 * 2. authorize - Kiểm tra role (có quyền không)
 * 3. validate - Validate request body/params
 * 4. controller - Xử lý request
 * 
 * ENDPOINTS:
 * GET    /api/categories         - Public: Danh sách categories
 * GET    /api/categories/tree    - Public: Category tree cho menu
 * GET    /api/categories/:slug   - Public: Chi tiết theo slug
 * POST   /api/categories         - Admin: Tạo mới
 * PUT    /api/categories/:id     - Admin: Cập nhật
 * DELETE /api/categories/:id     - Admin: Xóa
 */

import { Router } from 'express';
import { categoryController } from './category.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { createCategorySchema, updateCategorySchema } from './category.schema.js';

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
// Không cần đăng nhập, ai cũng có thể truy cập

/**
 * GET /api/categories
 * Lấy danh sách tất cả categories
 * 
 * Query: ?type=PRODUCT&isActive=true&includeChildren=true
 */
router.get('/', categoryController.getAll);

/**
 * GET /api/categories/tree
 * Lấy categories dạng tree (cây phân cấp)
 * 
 * Query: ?type=PRODUCT
 */
router.get('/tree', categoryController.getTree);

/**
 * GET /api/categories/:slug
 * Lấy chi tiết category theo slug
 * 
 * Params: slug = URL-friendly string
 * VD: /api/categories/tra-oolong
 */
router.get('/:slug', categoryController.getBySlug);

// ============================================================================
// ADMIN ROUTES
// ============================================================================
// Yêu cầu: Đăng nhập + Role ADMIN

/**
 * POST /api/categories
 * Tạo category mới
 * 
 * Middlewares:
 * 1. authenticate - Verify JWT token
 * 2. authorize('ADMIN') - Check user role
 * 3. validate(schema) - Validate request body
 */
router.post(
  '/',
  authenticate,           // Kiểm tra đã đăng nhập
  authorize('ADMIN'),     // Kiểm tra role ADMIN
  validate(createCategorySchema), // Validate body
  categoryController.create
);

/**
 * PUT /api/categories/:id
 * Cập nhật category
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCategorySchema),
  categoryController.update
);

/**
 * DELETE /api/categories/:id
 * Xóa category
 * 
 * LƯU Ý: Không thể xóa nếu có products hoặc children
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  categoryController.delete
);

export default router;
