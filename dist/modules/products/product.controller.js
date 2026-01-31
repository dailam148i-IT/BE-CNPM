/**
 * =============================================================================
 * PRODUCT.CONTROLLER.TS - Xử lý Request/Response cho Products
 * =============================================================================
 *
 * Controller là cầu nối giữa Routes và Service
 *
 * NHIỆM VỤ:
 * - Nhận request từ client
 * - Extract dữ liệu từ req.body, req.params, req.query
 * - Gọi Service xử lý logic nghiệp vụ
 * - Trả response chuẩn JSON
 *
 * RESPONSE FORMAT:
 *   {
 *     "success": true/false,
 *     "data": {...} hoặc "message": "..."
 *   }
 *
 * LƯU Ý:
 * - Public endpoints: Mặc định chỉ lấy products PUBLISHED
 * - Admin endpoints: Lấy tất cả status
 */
import { productService } from './product.service.js';
export const productController = {
    /**
     * getAll - Lấy danh sách sản phẩm (Public)
     *
     * Route: GET /api/products
     * Access: Public
     *
     * QUERY PARAMS:
     * - page, limit: Pagination
     * - categoryId, categorySlug: Filter by category
     * - minPrice, maxPrice: Price range
     * - search: Full-text search
     * - sortBy: createdAt, price, name
     * - sortOrder: asc, desc
     *
     * LƯU Ý: Tự động filter status=PUBLISHED cho public
     */
    async getAll(req, res, next) {
        try {
            // Public: mặc định chỉ lấy PUBLISHED
            const options = {
                ...req.query,
                status: req.query.status || 'PUBLISHED',
            };
            const result = await productService.findAll(options);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * getAllAdmin - Lấy tất cả sản phẩm (Admin)
     *
     * Route: GET /api/products/admin
     * Access: Admin only
     *
     * Khác với getAll: Không filter status, lấy tất cả
     */
    async getAllAdmin(req, res, next) {
        try {
            const result = await productService.findAll(req.query);
            res.json({ success: true, data: result });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * getBySlug - Chi tiết sản phẩm theo slug (Public)
     *
     * Route: GET /api/products/detail/:slug
     * Access: Public
     *
     * Response bao gồm:
     * - Product info
     * - Images
     * - Reviews (10 gần nhất)
     * - Rating stats
     * - Related products (4)
     */
    async getBySlug(req, res, next) {
        try {
            const product = await productService.findBySlug(req.params.slug);
            res.json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * getById - Chi tiết sản phẩm theo ID (Admin)
     *
     * Route: GET /api/products/admin/:id
     * Access: Admin only
     *
     * Dùng để edit product trong admin panel
     */
    async getById(req, res, next) {
        try {
            const product = await productService.findById(req.params.id);
            res.json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * create - Tạo sản phẩm mới (Admin)
     *
     * Route: POST /api/products
     * Access: Admin only
     *
     * BODY:
     * {
     *   "name": "Trà Oolong Cao Cấp",
     *   "price": 150000,
     *   "categoryId": "abc123",
     *   "description": "Mô tả dài...",
     *   "images": [
     *     { "url": "https://...", "isThumbnail": true }
     *   ]
     * }
     */
    async create(req, res, next) {
        try {
            // Tách images ra khỏi productData
            const { images, ...productData } = req.body;
            const product = await productService.create(productData, images);
            res.status(201).json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * update - Cập nhật sản phẩm (Admin)
     *
     * Route: PUT /api/products/:id
     * Access: Admin only
     *
     * Hỗ trợ partial update - chỉ update fields được truyền
     * Nếu truyền images → replace tất cả images hiện tại
     */
    async update(req, res, next) {
        try {
            const { images, ...productData } = req.body;
            const product = await productService.update(req.params.id, productData, images);
            res.json({ success: true, data: product });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * delete - Xóa sản phẩm (Admin)
     *
     * Route: DELETE /api/products/:id
     * Access: Admin only
     *
     * BEHAVIOR:
     * - Nếu đã có đơn hàng: Soft delete (chuyển DISCONTINUED)
     * - Nếu chưa có đơn hàng: Hard delete (xóa hẳn)
     */
    async delete(req, res, next) {
        try {
            const result = await productService.delete(req.params.id);
            res.json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=product.controller.js.map