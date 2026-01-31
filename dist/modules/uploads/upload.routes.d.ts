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
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=upload.routes.d.ts.map