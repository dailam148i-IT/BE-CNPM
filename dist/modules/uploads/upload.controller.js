/**
 * =============================================================================
 * UPLOAD.CONTROLLER.TS - Controller xử lý HTTP requests cho Upload
 * =============================================================================
 */
import { uploadService } from './upload.service.js';
export const uploadController = {
    /**
     * uploadSingle - Upload một ảnh
     *
     * POST /api/uploads/image
     * Body: { folder: 'products', storageType: 'local' | 'cloudinary' }
     * File: multipart/form-data với field name 'image'
     */
    async uploadSingle(req, res, next) {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn file để upload',
                });
            }
            const folder = req.body.folder || 'general';
            const storageType = req.body.storageType || 'local';
            const result = await uploadService.uploadImage(req.file.path, folder, storageType);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * uploadMultiple - Upload nhiều ảnh
     *
     * POST /api/uploads/images
     * Body: { folder: 'products', storageType: 'local' | 'cloudinary' }
     * Files: multipart/form-data với field name 'images' (max 10)
     */
    async uploadMultiple(req, res, next) {
        try {
            const files = req.files;
            if (!files || files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng chọn ít nhất 1 file',
                });
            }
            const folder = req.body.folder || 'general';
            const storageType = req.body.storageType || 'local';
            const filePaths = files.map((f) => f.path);
            const results = await uploadService.uploadMultiple(filePaths, folder, storageType);
            res.json({
                success: true,
                data: results,
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * deleteImage - Xóa ảnh
     *
     * DELETE /api/uploads/image
     * Body: { publicId: '...', storageType: 'local' | 'cloudinary' }
     */
    async deleteImage(req, res, next) {
        try {
            const { publicId, storageType } = req.body;
            if (!publicId) {
                return res.status(400).json({
                    success: false,
                    message: 'publicId là bắt buộc',
                });
            }
            const result = await uploadService.deleteImage(publicId, storageType || 'local');
            res.json({
                success: true,
                message: result.success ? 'Xóa ảnh thành công' : 'Xóa ảnh thất bại',
            });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * listMedia - Lấy danh sách tất cả media
     *
     * GET /api/uploads
     * Query: { folder?: 'products', storageType?: 'all' | 'local' | 'cloudinary' }
     */
    async listMedia(req, res, next) {
        try {
            const folder = req.query.folder;
            const storageType = req.query.storageType || 'all';
            const media = await uploadService.listAllMedia(folder, storageType);
            // Tính tổng size
            const totalSize = media.reduce((sum, item) => sum + item.size, 0);
            // Lấy danh sách folders
            const folders = [...new Set(media.map((item) => item.folder))];
            res.json({
                success: true,
                data: {
                    items: media,
                    total: media.length,
                    totalSize,
                    folders,
                },
            });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=upload.controller.js.map