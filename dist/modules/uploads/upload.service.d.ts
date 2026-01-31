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
    url: string;
    publicId: string;
    storageType: StorageType;
    width?: number;
    height?: number;
}
export declare const uploadService: {
    /**
     * uploadImage - Upload single image
     *
     * @param filePath - Đường dẫn file tạm từ multer
     * @param folder - Thư mục/prefix (VD: 'products', 'news')
     * @param storageType - 'local' | 'cloudinary'
     */
    uploadImage(filePath: string, folder?: string, storageType?: StorageType): Promise<UploadResult>;
    /**
     * uploadMultiple - Upload nhiều ảnh
     */
    uploadMultiple(filePaths: string[], folder?: string, storageType?: StorageType): Promise<UploadResult[]>;
    /**
     * uploadToCloudinary - Upload lên Cloudinary Cloud
     */
    uploadToCloudinary(filePath: string, folder: string): Promise<UploadResult>;
    /**
     * saveLocal - Lưu file vào thư mục uploads/ trên server
     */
    saveLocal(filePath: string, folder: string): Promise<UploadResult>;
    /**
     * deleteImage - Xóa ảnh theo publicId
     */
    deleteImage(publicId: string, storageType: StorageType): Promise<{
        success: boolean;
    }>;
    /**
     * deleteFromCloudinary - Xóa ảnh từ Cloudinary
     */
    deleteFromCloudinary(publicId: string): Promise<{
        success: boolean;
    }>;
    /**
     * deleteLocal - Xóa file local
     */
    deleteLocal(publicId: string): Promise<{
        success: boolean;
    }>;
    /**
     * deleteMultiple - Xóa nhiều ảnh
     */
    deleteMultiple(publicIds: string[], storageType: StorageType): Promise<{
        success: boolean;
    }[]>;
    /**
     * MediaItem - Thông tin 1 file media
     */
    /**
     * listAllMedia - Lấy danh sách tất cả media từ cả local và cloudinary
     *
     * @param folder - Filter by folder (optional)
     * @param storageType - Filter by storage type (optional, 'all' | 'local' | 'cloudinary')
     */
    listAllMedia(folder?: string, storageType?: "all" | StorageType): Promise<MediaItem[]>;
    /**
     * listLocalMedia - Scan thư mục uploads/ để lấy danh sách files
     */
    listLocalMedia(folder?: string): Promise<MediaItem[]>;
    /**
     * listCloudinaryMedia - Lấy danh sách từ Cloudinary Admin API
     */
    listCloudinaryMedia(folder?: string): Promise<MediaItem[]>;
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
//# sourceMappingURL=upload.service.d.ts.map