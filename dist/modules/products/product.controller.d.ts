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
import { Request, Response, NextFunction } from 'express';
export declare const productController: {
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
    getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * getAllAdmin - Lấy tất cả sản phẩm (Admin)
     *
     * Route: GET /api/products/admin
     * Access: Admin only
     *
     * Khác với getAll: Không filter status, lấy tất cả
     */
    getAllAdmin(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    getBySlug(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * getById - Chi tiết sản phẩm theo ID (Admin)
     *
     * Route: GET /api/products/admin/:id
     * Access: Admin only
     *
     * Dùng để edit product trong admin panel
     */
    getById(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * update - Cập nhật sản phẩm (Admin)
     *
     * Route: PUT /api/products/:id
     * Access: Admin only
     *
     * Hỗ trợ partial update - chỉ update fields được truyền
     * Nếu truyền images → replace tất cả images hiện tại
     */
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=product.controller.d.ts.map