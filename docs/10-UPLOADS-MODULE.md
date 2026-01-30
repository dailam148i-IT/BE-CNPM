# Bước 10: Uploads Module (Cloudinary)

## 10.1. Tổng Quan

Module Uploads xử lý:
- **Upload Image** - Tải ảnh lên Cloudinary
- **Delete Image** - Xóa ảnh từ Cloudinary
- **Multiple Upload** - Tải nhiều ảnh cùng lúc

---

## 10.2. Cloudinary Config

Tạo `src/config/cloudinary.config.js`:

```javascript
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

export default cloudinary;
```

---

## 10.3. Upload Service

Tạo `src/modules/uploads/upload.service.js`:

```javascript
import cloudinary from '../../config/cloudinary.config.js';
import fs from 'fs';

export const uploadService = {
  /**
   * Upload single image
   * @param {string} filePath - Đường dẫn file local
   * @param {string} folder - Folder trên Cloudinary
   */
  async uploadImage(filePath, folder = 'teashop') {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Max size
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      // Xóa file tạm sau khi upload
      fs.unlinkSync(filePath);

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height
      };
    } catch (error) {
      // Xóa file tạm nếu upload lỗi
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
  },

  /**
   * Upload multiple images
   */
  async uploadMultiple(filePaths, folder = 'teashop') {
    const results = await Promise.all(
      filePaths.map(path => this.uploadImage(path, folder))
    );
    return results;
  },

  /**
   * Delete image from Cloudinary
   */
  async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: result.result === 'ok' };
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  },

  /**
   * Delete multiple images
   */
  async deleteMultiple(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds);
      return result;
    } catch (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }
};
```

---

## 10.4. Multer Middleware

Tạo `src/middleware/multer.middleware.js`:

```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tạo thư mục uploads nếu chưa có
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${uniqueName}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file ảnh (jpg, png, gif, webp)'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});
```

---

## 10.5. Upload Controller & Routes

Tạo `src/modules/uploads/upload.controller.js`:

```javascript
import { uploadService } from './upload.service.js';

export const uploadController = {
  async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn file để upload'
        });
      }

      const folder = req.body.folder || 'teashop';
      const result = await uploadService.uploadImage(req.file.path, folder);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng chọn ít nhất 1 file'
        });
      }

      const folder = req.body.folder || 'teashop';
      const filePaths = req.files.map(f => f.path);
      const results = await uploadService.uploadMultiple(filePaths, folder);

      res.json({
        success: true,
        data: results
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteImage(req, res, next) {
    try {
      const { publicId } = req.body;
      
      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: 'publicId là bắt buộc'
        });
      }

      const result = await uploadService.deleteImage(publicId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
};
```

Tạo `src/modules/uploads/upload.routes.js`:

```javascript
import { Router } from 'express';
import { uploadController } from './upload.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { upload } from '../../middleware/multer.middleware.js';

const router = Router();

// Chỉ Admin/Staff được upload
router.use(authenticate);
router.use(authorize('ADMIN', 'STAFF'));

router.post('/image', upload.single('image'), uploadController.uploadSingle);
router.post('/images', upload.array('images', 10), uploadController.uploadMultiple);
router.delete('/image', uploadController.deleteImage);

export default router;
```

---

## ✅ Checklist Bước 10

- [ ] Đã cấu hình Cloudinary trong .env
- [ ] Đã tạo upload service, controller, routes
- [ ] Test: POST /api/uploads/image
- [ ] Test: POST /api/uploads/images

---

**Tiếp theo:** [11-DASHBOARD-MODULE.md](./11-DASHBOARD-MODULE.md)
