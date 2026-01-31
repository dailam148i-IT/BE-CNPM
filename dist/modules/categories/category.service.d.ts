/**
 * =============================================================================
 * CATEGORY.SERVICE.TS - Business Logic cho Categories
 * =============================================================================
 *
 * Service chứa toàn bộ business logic cho Category module
 *
 * NHIỆM VỤ:
 * - Truy vấn database qua Prisma
 * - Xử lý logic nghiệp vụ (tạo slug, validate parent, etc.)
 * - Throw custom errors khi có lỗi
 *
 * KHÔNG LÀM:
 * - Xử lý request/response (đó là việc của Controller)
 * - Validate input (đó là việc của Schema + Middleware)
 *
 * CÁC FUNCTIONS:
 * - findAll()    - Lấy danh sách categories
 * - getTree()    - Lấy cây danh mục cho menu
 * - findBySlug() - Lấy category theo slug
 * - create()     - Tạo category mới (Admin)
 * - update()     - Cập nhật category (Admin)
 * - delete()     - Xóa category (Admin)
 */
import type { CreateCategoryDto, UpdateCategoryDto, CategoryQueryDto } from './category.schema.js';
export declare const categoryService: {
    /**
     * findAll - Lấy danh sách tất cả categories
     *
     * @param options - Query options từ request
     * @param options.type - Loại category: PRODUCT, NEWS, PAGE
     * @param options.isActive - Trạng thái active
     * @param options.includeChildren - Có include children không
     *
     * @returns Array categories với thông tin parent và count products/news
     *
     * VÍ DỤ REQUEST:
     *   GET /api/categories?type=PRODUCT&isActive=true
     *
     * VÍ DỤ RESPONSE:
     *   [
     *     {
     *       id: "abc123",
     *       name: "Trà Oolong",
     *       slug: "tra-oolong",
     *       parent: null,
     *       _count: { products: 5, news: 0 }
     *     }
     *   ]
     */
    findAll(options?: CategoryQueryDto): Promise<({
        parent: {
            id: string;
            name: string;
        } | null;
        children: {
            type: import(".prisma/client").$Enums.CategoryType;
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            isActive: boolean;
            slug: string;
        }[];
        _count: {
            news: number;
            products: number;
        };
    } & {
        type: import(".prisma/client").$Enums.CategoryType;
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        isActive: boolean;
        slug: string;
    })[]>;
    /**
     * getTree - Lấy categories dạng tree (cây phân cấp)
     *
     * Dùng cho navigation menu, sidebar, etc.
     * Chỉ lấy root categories (parentId = null) và nested children
     *
     * @param type - Loại category (mặc định PRODUCT)
     * @returns Array tree structure với max 3 cấp
     *
     * VÍ DỤ RESPONSE:
     *   [
     *     {
     *       name: "Trà",
     *       children: [
     *         { name: "Trà Oolong", children: [...] },
     *         { name: "Trà Xanh", children: [...] }
     *       ]
     *     }
     *   ]
     */
    getTree(type?: string): Promise<({
        children: ({
            children: {
                type: import(".prisma/client").$Enums.CategoryType;
                id: string;
                name: string;
                description: string | null;
                parentId: string | null;
                isActive: boolean;
                slug: string;
            }[];
        } & {
            type: import(".prisma/client").$Enums.CategoryType;
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            isActive: boolean;
            slug: string;
        })[];
    } & {
        type: import(".prisma/client").$Enums.CategoryType;
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        isActive: boolean;
        slug: string;
    })[]>;
    /**
     * findBySlug - Lấy category theo slug
     *
     * Dùng cho trang category detail
     * Include cả products thuộc category này
     *
     * @param slug - URL-friendly string (VD: "tra-oolong")
     * @throws NotFoundError nếu không tìm thấy
     *
     * VÍ DỤ:
     *   GET /api/categories/tra-oolong
     */
    findBySlug(slug: string): Promise<{
        parent: {
            type: import(".prisma/client").$Enums.CategoryType;
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            isActive: boolean;
            slug: string;
        } | null;
        children: {
            type: import(".prisma/client").$Enums.CategoryType;
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            isActive: boolean;
            slug: string;
        }[];
        products: ({
            images: {
                id: string;
                isThumbnail: boolean;
                sortOrder: number;
                productId: string;
                imageUrl: string;
            }[];
        } & {
            status: import(".prisma/client").$Enums.ProductStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            slug: string;
            shortDesc: string | null;
            price: import("@prisma/client/runtime/library.js").Decimal;
            stockQuantity: number;
            sku: string | null;
            categoryId: string | null;
            version: number;
        })[];
    } & {
        type: import(".prisma/client").$Enums.CategoryType;
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        isActive: boolean;
        slug: string;
    }>;
    /**
     * create - Tạo category mới (Admin only)
     *
     * FLOW:
     * 1. Tạo slug từ name (VD: "Trà Oolong" → "tra-oolong")
     * 2. Check slug đã tồn tại chưa
     * 3. Check parent tồn tại (nếu có)
     * 4. Tạo category mới
     *
     * @param data - Dữ liệu từ request body
     * @throws BadRequestError nếu slug đã tồn tại
     * @throws NotFoundError nếu parent không tồn tại
     */
    create(data: CreateCategoryDto): Promise<{
        type: import(".prisma/client").$Enums.CategoryType;
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        isActive: boolean;
        slug: string;
    }>;
    /**
     * update - Cập nhật category (Admin only)
     *
     * Chỉ update các fields được truyền vào
     * Tự động tạo slug mới nếu đổi name
     *
     * @param id - Category ID
     * @param data - Dữ liệu cần update
     * @throws NotFoundError nếu category không tồn tại
     * @throws BadRequestError nếu slug mới bị trùng
     */
    update(id: string, data: UpdateCategoryDto): Promise<{
        type: import(".prisma/client").$Enums.CategoryType;
        id: string;
        name: string;
        description: string | null;
        parentId: string | null;
        isActive: boolean;
        slug: string;
    }>;
    /**
     * delete - Xóa category (Admin only)
     *
     * VALIDATION RULES:
     * - Không thể xóa nếu có products thuộc category này
     * - Không thể xóa nếu có children categories
     *
     * @param id - Category ID
     * @throws NotFoundError nếu không tìm thấy
     * @throws BadRequestError nếu có products hoặc children
     */
    delete(id: string): Promise<{
        message: string;
    }>;
};
//# sourceMappingURL=category.service.d.ts.map