/**
 * =============================================================================
 * MULTER.TS - Middleware xử lý File Upload
 * =============================================================================
 *
 * NHIỆM VỤ:
 * - Parse multipart/form-data requests
 * - Lưu file tạm vào thư mục uploads/
 * - Validate file type và size
 *
 * SỬ DỤNG:
 *   import { upload } from './multer.js';
 *
 *   // Single file
 *   router.post('/product', upload.single('image'), controller.create);
 *
 *   // Multiple files (max 10)
 *   router.post('/product', upload.array('files', 10), controller.create);
 */
import multer from 'multer';
/**
 * MULTER INSTANCE
 * - storage: Config lưu file
 * - fileFilter: Validate file type
 * - limits: Giới hạn size (5MB)
 */
export declare const upload: multer.Multer;
/**
 * HELPER: Xóa file tạm sau khi đã upload lên Cloudinary
 */
export declare const cleanupTempFiles: (files: Express.Multer.File[]) => void;
//# sourceMappingURL=multer.d.ts.map