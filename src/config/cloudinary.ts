/**
 * =============================================================================
 * CLOUDINARY.TS - Cấu hình Cloudinary Cloud Storage
 * =============================================================================
 * 
 * Cloudinary là dịch vụ lưu trữ và xử lý ảnh trên cloud
 * 
 * ƯU ĐIỂM SO VỚI LOCAL:
 * - CDN toàn cầu (load nhanh từ mọi nơi)
 * - Tự động tối ưu ảnh (resize, compress)
 * - Không tốn dung lượng server
 * 
 * NHƯỢC ĐIỂM:
 * - Phụ thuộc dịch vụ bên ngoài
 * - Có giới hạn free tier
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình Cloudinary với credentials từ .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Luôn dùng HTTPS
});

export default cloudinary;
