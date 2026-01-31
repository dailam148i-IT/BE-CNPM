/**
 * =============================================================================
 * UPLOAD.ROUTES.TS - Routes cho Upload Module
 * =============================================================================
 * 
 * ENDPOINTS:
 * - GET    /api/uploads         → List all media files
 * - POST   /api/uploads/image   → Upload single image
 * - POST   /api/uploads/images  → Upload multiple images (max 10)
 * - DELETE /api/uploads/image   → Delete image by publicId
 * 
 * YÊU CẦU: Đăng nhập + Role ADMIN
 * 
 * STORAGE OPTIONS (gửi trong body):
 * - storageType: 'local' | 'cloudinary'
 * - folder: Thư mục lưu (VD: 'products', 'news', 'banners')
 */

import { Router } from 'express';
import { uploadController } from './upload.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { upload } from '../../middleware/multer.js';

const router = Router();

// Tất cả routes yêu cầu đăng nhập + ADMIN role
router.use(authenticate);
router.use(authorize('ADMIN'));

/**
 * GET /api/uploads
 * Lấy danh sách tất cả media
 * 
 * Query params:
 * - folder: string (optional) - Filter by folder name
 * - storageType: 'all' | 'local' | 'cloudinary' (optional, default: 'all')
 */
router.get('/', uploadController.listMedia);

/**
 * POST /api/uploads/image
 * Upload một ảnh
 * 
 * FormData:
 * - image: File (required)
 * - folder: string (optional, default: 'general')
 * - storageType: 'local' | 'cloudinary' (optional, default: 'local')
 */
router.post('/image', upload.single('image'), uploadController.uploadSingle);

/**
 * POST /api/uploads/images
 * Upload nhiều ảnh (max 10)
 * 
 * FormData:
 * - images: File[] (required, max 10 files)
 * - folder: string (optional, default: 'general')
 * - storageType: 'local' | 'cloudinary' (optional, default: 'local')
 */
router.post('/images', upload.array('images', 10), uploadController.uploadMultiple);

/**
 * DELETE /api/uploads/image
 * Xóa ảnh
 * 
 * Body (JSON):
 * - publicId: string (required) - ID hoặc path của ảnh
 * - storageType: 'local' | 'cloudinary' (required)
 */
router.delete('/image', uploadController.deleteImage);

export default router;

