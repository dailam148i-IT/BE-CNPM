/**
 * =============================================================================
 * UPLOAD.SERVICE.TS - Service xử lý Upload File
 * =============================================================================
 * 
 * NHIỆM VỤ:
 * - Upload ảnh lên Cloudinary hoặc lưu local
 * - Xóa ảnh từ Cloudinary hoặc local
 * - Tự động chọn storage dựa vào config hoặc request
 * 
 * STORAGE OPTIONS:
 * - 'local': Lưu vào thư mục uploads/ trên server
 * - 'cloudinary': Upload lên Cloudinary cloud
 * 
 * VÍ DỤ SỬ DỤNG:
 *   // Upload single file
 *   const result = await uploadService.uploadImage(file.path, 'products', 'cloudinary');
 *   
 *   // Delete image
 *   await uploadService.deleteImage(publicId, 'cloudinary');
 */

import cloudinary from '../../config/cloudinary.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module: Tạo __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Thư mục lưu file local
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
const PUBLIC_UPLOADS_PATH = '/uploads'; // URL path để truy cập

// Đảm bảo thư mục tồn tại
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * STORAGE TYPE
 * - 'local': Lưu file trên server
 * - 'cloudinary': Upload lên cloud
 */
export type StorageType = 'local' | 'cloudinary';

/**
 * UPLOAD RESULT
 * Kết quả trả về sau khi upload
 */
export interface UploadResult {
  url: string;           // URL để truy cập ảnh
  publicId: string;      // ID để xóa ảnh (Cloudinary) hoặc filename (local)
  storageType: StorageType;
  width?: number;
  height?: number;
}

export const uploadService = {
  /**
   * uploadImage - Upload single image
   * 
   * @param filePath - Đường dẫn file tạm từ multer
   * @param folder - Thư mục/prefix (VD: 'products', 'news')
   * @param storageType - 'local' | 'cloudinary'
   */
  async uploadImage(
    filePath: string,
    folder: string = 'teashop',
    storageType: StorageType = 'local'
  ): Promise<UploadResult> {
    if (storageType === 'cloudinary') {
      return this.uploadToCloudinary(filePath, folder);
    } else {
      return this.saveLocal(filePath, folder);
    }
  },

  /**
   * uploadMultiple - Upload nhiều ảnh
   */
  async uploadMultiple(
    filePaths: string[],
    folder: string = 'teashop',
    storageType: StorageType = 'local'
  ): Promise<UploadResult[]> {
    const results = await Promise.all(
      filePaths.map((filePath) => this.uploadImage(filePath, folder, storageType))
    );
    return results;
  },

  /**
   * uploadToCloudinary - Upload lên Cloudinary Cloud
   */
  async uploadToCloudinary(filePath: string, folder: string): Promise<UploadResult> {
    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: `teashop/${folder}`,
        resource_type: 'image',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' }, // Max size
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      });

      // Xóa file tạm sau khi upload thành công
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
        storageType: 'cloudinary',
        width: result.width,
        height: result.height,
      };
    } catch (error: any) {
      // Xóa file tạm nếu upload lỗi
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
  },

  /**
   * saveLocal - Lưu file vào thư mục uploads/ trên server
   */
  async saveLocal(filePath: string, folder: string): Promise<UploadResult> {
    try {
      // Tạo thư mục con nếu chưa có
      const targetDir = path.join(UPLOADS_DIR, folder);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Lấy tên file từ path
      const filename = path.basename(filePath);
      const targetPath = path.join(targetDir, filename);

      // Di chuyển file từ temp → uploads/folder/
      fs.renameSync(filePath, targetPath);

      // Tạo URL public để truy cập
      const publicUrl = `${PUBLIC_UPLOADS_PATH}/${folder}/${filename}`;

      return {
        url: publicUrl,
        publicId: `${folder}/${filename}`, // Dùng để xóa sau này
        storageType: 'local',
      };
    } catch (error: any) {
      throw new Error(`Local save failed: ${error.message}`);
    }
  },

  /**
   * deleteImage - Xóa ảnh theo publicId
   */
  async deleteImage(publicId: string, storageType: StorageType): Promise<{ success: boolean }> {
    if (storageType === 'cloudinary') {
      return this.deleteFromCloudinary(publicId);
    } else {
      return this.deleteLocal(publicId);
    }
  },

  /**
   * deleteFromCloudinary - Xóa ảnh từ Cloudinary
   */
  async deleteFromCloudinary(publicId: string): Promise<{ success: boolean }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return { success: result.result === 'ok' };
    } catch (error: any) {
      throw new Error(`Cloudinary delete failed: ${error.message}`);
    }
  },

  /**
   * deleteLocal - Xóa file local
   */
  async deleteLocal(publicId: string): Promise<{ success: boolean }> {
    try {
      const filePath = path.join(UPLOADS_DIR, publicId);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error: any) {
      throw new Error(`Local delete failed: ${error.message}`);
    }
  },

  /**
   * deleteMultiple - Xóa nhiều ảnh
   */
  async deleteMultiple(
    publicIds: string[],
    storageType: StorageType
  ): Promise<{ success: boolean }[]> {
    const results = await Promise.all(
      publicIds.map((id) => this.deleteImage(id, storageType))
    );
    return results;
  },

  // ============================================================================
  // MEDIA LISTING FUNCTIONS
  // ============================================================================

  /**
   * MediaItem - Thông tin 1 file media
   */

  /**
   * listAllMedia - Lấy danh sách tất cả media từ cả local và cloudinary
   * 
   * @param folder - Filter by folder (optional)
   * @param storageType - Filter by storage type (optional, 'all' | 'local' | 'cloudinary')
   */
  async listAllMedia(
    folder?: string,
    storageType: 'all' | StorageType = 'all'
  ): Promise<MediaItem[]> {
    const results: MediaItem[] = [];

    // Lấy từ local
    if (storageType === 'all' || storageType === 'local') {
      const localMedia = await this.listLocalMedia(folder);
      results.push(...localMedia);
    }

    // Lấy từ Cloudinary (nếu có config)
    if (storageType === 'all' || storageType === 'cloudinary') {
      try {
        const cloudMedia = await this.listCloudinaryMedia(folder);
        results.push(...cloudMedia);
      } catch (error) {
        // Cloudinary có thể chưa config hoặc lỗi
        console.warn('Cloudinary listing failed:', error);
      }
    }

    // Sort by createdAt desc
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return results;
  },

  /**
   * listLocalMedia - Scan thư mục uploads/ để lấy danh sách files
   */
  async listLocalMedia(folder?: string): Promise<MediaItem[]> {
    const results: MediaItem[] = [];
    
    const scanDir = folder ? path.join(UPLOADS_DIR, folder) : UPLOADS_DIR;
    
    if (!fs.existsSync(scanDir)) {
      return results;
    }

    const scanFolder = (dir: string, folderName: string) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          // Đệ quy scan thư mục con
          scanFolder(filePath, file);
        } else if (stats.isFile()) {
          // Chỉ lấy file ảnh
          const ext = path.extname(file).toLowerCase();
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
            const relativePath = path.relative(UPLOADS_DIR, filePath).replace(/\\/g, '/');
            results.push({
              url: `${PUBLIC_UPLOADS_PATH}/${relativePath}`,
              publicId: relativePath,
              filename: file,
              folder: folderName || path.dirname(relativePath),
              size: stats.size,
              storageType: 'local',
              createdAt: stats.birthtime.toISOString(),
            });
          }
        }
      }
    };

    // Nếu folder được chỉ định, chỉ scan folder đó
    if (folder) {
      scanFolder(scanDir, folder);
    } else {
      // Scan tất cả folders
      const topLevelItems = fs.readdirSync(scanDir);
      for (const item of topLevelItems) {
        const itemPath = path.join(scanDir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          scanFolder(itemPath, item);
        }
      }
    }

    return results;
  },

  /**
   * listCloudinaryMedia - Lấy danh sách từ Cloudinary Admin API
   */
  async listCloudinaryMedia(folder?: string): Promise<MediaItem[]> {
    const results: MediaItem[] = [];
    
    try {
      const prefix = folder ? `teashop/${folder}` : 'teashop';
      
      const response = await cloudinary.api.resources({
        type: 'upload',
        prefix,
        max_results: 100,
        resource_type: 'image',
      });

      for (const resource of response.resources) {
        results.push({
          url: resource.secure_url,
          publicId: resource.public_id,
          filename: resource.public_id.split('/').pop() || '',
          folder: resource.folder || folder || 'teashop',
          size: resource.bytes,
          width: resource.width,
          height: resource.height,
          storageType: 'cloudinary',
          createdAt: resource.created_at,
        });
      }
    } catch (error: any) {
      // Có thể chưa config Cloudinary hoặc không có quyền Admin API
      console.warn('Cloudinary list failed:', error.message);
    }

    return results;
  },
};

/**
 * MediaItem - Interface cho thông tin media
 */
export interface MediaItem {
  url: string;
  publicId: string;
  filename: string;
  folder: string;
  size: number;
  width?: number;
  height?: number;
  storageType: StorageType;
  createdAt: string;
}
