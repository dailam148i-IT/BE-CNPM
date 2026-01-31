/**
 * =============================================================================
 * UPLOAD.CONTROLLER.TS - Controller xử lý HTTP requests cho Upload
 * =============================================================================
 */
import { Request, Response, NextFunction } from 'express';
export declare const uploadController: {
    /**
     * uploadSingle - Upload một ảnh
     *
     * POST /api/uploads/image
     * Body: { folder: 'products', storageType: 'local' | 'cloudinary' }
     * File: multipart/form-data với field name 'image'
     */
    uploadSingle(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * uploadMultiple - Upload nhiều ảnh
     *
     * POST /api/uploads/images
     * Body: { folder: 'products', storageType: 'local' | 'cloudinary' }
     * Files: multipart/form-data với field name 'images' (max 10)
     */
    uploadMultiple(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * deleteImage - Xóa ảnh
     *
     * DELETE /api/uploads/image
     * Body: { publicId: '...', storageType: 'local' | 'cloudinary' }
     */
    deleteImage(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * listMedia - Lấy danh sách tất cả media
     *
     * GET /api/uploads
     * Query: { folder?: 'products', storageType?: 'all' | 'local' | 'cloudinary' }
     */
    listMedia(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=upload.controller.d.ts.map