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
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES Module: Tạo __dirname tương đương CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục lưu file tạm (sẽ được upload lên Cloudinary sau đó xóa)
const uploadDir = path.join(__dirname, '../../uploads');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * STORAGE CONFIG
 * - destination: Thư mục lưu file tạm
 * - filename: Tên file unique (timestamp + random)
 */
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Tạo tên file unique: 1234567890-123456789.jpg
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueName}${ext}`);
  },
});

/**
 * FILE FILTER
 * Chỉ cho phép upload ảnh (jpg, png, gif, webp)
 */
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (jpg, png, gif, webp)'));
  }
};

/**
 * MULTER INSTANCE
 * - storage: Config lưu file
 * - fileFilter: Validate file type
 * - limits: Giới hạn size (5MB)
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

/**
 * HELPER: Xóa file tạm sau khi đã upload lên Cloudinary
 */
export const cleanupTempFiles = (files: Express.Multer.File[]) => {
  files.forEach((file) => {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};
