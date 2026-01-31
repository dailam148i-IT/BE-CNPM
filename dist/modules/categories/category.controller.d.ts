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
import { Request, Response, NextFunction } from 'express';
export declare const categoryController: {
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
    getAll(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    getTree(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    getBySlug(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    create(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    update(req: Request, res: Response, next: NextFunction): Promise<void>;
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
    delete(req: Request, res: Response, next: NextFunction): Promise<void>;
};
//# sourceMappingURL=category.controller.d.ts.map