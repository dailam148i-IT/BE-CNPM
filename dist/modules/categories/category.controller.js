/**
 * =============================================================================
 * CATEGORY.CONTROLLER.TS - Xử lý Request/Response cho Categories
 * =============================================================================
 *
 * Controller là cầu nối giữa Routes và Service
 *
 * NHIỆM VỤ:
 * - Nhận request từ client (req.body, req.params, req.query)
 * - Gọi Service xử lý logic nghiệp vụ
 * - Trả response về client (JSON format)
 * - Forward errors cho Error Handler middleware
 *
 * KHÔNG LÀM:
 * - Business logic (đó là việc của Service)
 * - Truy vấn database trực tiếp
 * - Validate input (đó là việc của Middleware)
 *
 * PATTERN:
 *   try {
 *     const result = await service.method();
 *     res.json({ success: true, data: result });
 *   } catch (error) {
 *     next(error); // → Error Handler
 *   }
 */
import { categoryService } from './category.service.js';
export const categoryController = {
    /**
     * getAll - Lấy danh sách categories
     *
     * Route: GET /api/categories
     * Access: Public
     *
     * QUERY PARAMS:
     * - type: PRODUCT | NEWS | PAGE
     * - isActive: true | false
     * - includeChildren: true | false
     *
     * VÍ DỤ:
     *   GET /api/categories?type=PRODUCT&isActive=true
     */
    async getAll(req, res, next) {
        try {
            // req.query chứa query parameters từ URL
            const categories = await categoryService.findAll(req.query);
            res.json({ success: true, data: categories });
        }
        catch (error) {
            // Chuyển error cho Error Handler middleware xử lý
            next(error);
        }
    },
    /**
     * getTree - Lấy categories dạng tree cho menu
     *
     * Route: GET /api/categories/tree
     * Access: Public
     *
     * QUERY PARAMS:
     * - type: PRODUCT | NEWS | PAGE (mặc định PRODUCT)
     *
     * USE CASE:
     * - Navigation menu
     * - Sidebar filter
     * - Breadcrumb generation
     */
    async getTree(req, res, next) {
        try {
            const { type = 'PRODUCT' } = req.query;
            const tree = await categoryService.getTree(type);
            res.json({ success: true, data: tree });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * getBySlug - Lấy category theo slug
     *
     * Route: GET /api/categories/:slug
     * Access: Public
     *
     * URL PARAMS:
     * - slug: URL-friendly string (VD: "tra-oolong")
     *
     * VÍ DỤ:
     *   GET /api/categories/tra-oolong
     */
    async getBySlug(req, res, next) {
        try {
            // req.params.slug lấy từ URL pattern /:slug
            const category = await categoryService.findBySlug(req.params.slug);
            res.json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * create - Tạo category mới
     *
     * Route: POST /api/categories
     * Access: Admin only (protected by middleware)
     *
     * BODY:
     * {
     *   "name": "Trà Oolong",
     *   "description": "Trà Oolong thượng hạng",
     *   "parentId": null,
     *   "type": "PRODUCT",
     *   "isActive": true
     * }
     *
     * RESPONSE: 201 Created
     */
    async create(req, res, next) {
        try {
            // req.body đã được validate bởi middleware
            const category = await categoryService.create(req.body);
            // 201 = Created (tiêu chuẩn REST API)
            res.status(201).json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * update - Cập nhật category
     *
     * Route: PUT /api/categories/:id
     * Access: Admin only
     *
     * URL PARAMS:
     * - id: Category ID
     *
     * BODY: Các fields cần update (partial update)
     */
    async update(req, res, next) {
        try {
            const category = await categoryService.update(req.params.id, req.body);
            res.json({ success: true, data: category });
        }
        catch (error) {
            next(error);
        }
    },
    /**
     * delete - Xóa category
     *
     * Route: DELETE /api/categories/:id
     * Access: Admin only
     *
     * LƯU Ý:
     * - Không thể xóa category có products
     * - Không thể xóa category có children
     */
    async delete(req, res, next) {
        try {
            const result = await categoryService.delete(req.params.id);
            res.json({ success: true, ...result });
        }
        catch (error) {
            next(error);
        }
    },
};
//# sourceMappingURL=category.controller.js.map