/**
 * =============================================================================
 * PRODUCT.SERVICE.TS - Business Logic cho Products
 * =============================================================================
 *
 * Service chứa toàn bộ business logic cho Product module
 * Đây là file phức tạp nhất vì có nhiều tính năng:
 * - Pagination (phân trang)
 * - Filtering (lọc theo category, price, search)
 * - Sorting (sắp xếp)
 * - Rating calculation (tính điểm đánh giá)
 *
 * NHIỆM VỤ:
 * - Truy vấn database qua Prisma
 * - Xử lý logic nghiệp vụ phức tạp
 * - Transaction cho operations nhiều bước
 *
 * CÁC FUNCTIONS:
 * - findAll()    - List products với pagination/filter
 * - findBySlug() - Chi tiết sản phẩm (public)
 * - findById()   - Chi tiết theo ID (admin)
 * - create()     - Tạo sản phẩm + images
 * - update()     - Cập nhật sản phẩm
 * - delete()     - Xóa (hard/soft delete)
 */
import type { CreateProductDto, UpdateProductDto, ProductQueryDto } from './product.schema.js';
/**
 * Interface cho product images
 * Dùng khi create/update product với nhiều ảnh
 */
interface ProductImage {
    url: string;
    isThumbnail?: boolean;
    sortOrder?: number;
}
export declare const productService: {
    /**
     * findAll - Lấy danh sách sản phẩm với đầy đủ options
     *
     * @param options - Query options từ request
     *
     * PAGINATION:
     * - page: Trang hiện tại (mặc định 1)
     * - limit: Số items/trang (mặc định 12)
     *
     * FILTERS:
     * - status: DRAFT, PUBLISHED, HIDDEN, DISCONTINUED
     * - categoryId hoặc categorySlug: Lọc theo danh mục
     * - minPrice, maxPrice: Khoảng giá
     * - search: Tìm trong name, description
     *
     * SORTING:
     * - sortBy: createdAt (mặc định), price, name
     * - sortOrder: desc (mặc định), asc
     *
     * OPTIMIZED: Sử dụng 1 query với include thay vì N+1 queries
     */
    findAll(options: ProductQueryDto): Promise<{
        products: {
            thumbnail: string | null;
            avgRating: number;
            reviewCount: number;
            reviews: undefined;
            category: {
                id: string;
                name: string;
                slug: string;
            } | null;
            _count: {
                reviews: number;
            };
            images: {
                id: string;
                isThumbnail: boolean;
                sortOrder: number;
                productId: string;
                imageUrl: string;
            }[];
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
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * findBySlug - Lấy chi tiết sản phẩm theo slug (Public)
     *
     * Dùng cho trang product detail
     * Include nhiều data: reviews, related products, rating stats
     *
     * @param slug - URL-friendly string (VD: "tra-oolong-cao-cap")
     * @throws NotFoundError nếu không tìm thấy
     */
    findBySlug(slug: string): Promise<{
        reviews: ({
            user: {
                fullName: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            productId: string;
            rating: number;
            commentText: string | null;
        })[];
        avgRating: number;
        reviewCount: number;
        relatedProducts: ({
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
        category: {
            type: import(".prisma/client").$Enums.CategoryType;
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            isActive: boolean;
            slug: string;
        } | null;
        images: {
            id: string;
            isThumbnail: boolean;
            sortOrder: number;
            productId: string;
            imageUrl: string;
        }[];
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
    }>;
    /**
     * findById - Lấy chi tiết theo ID (Admin only)
     *
     * Dùng trong admin panel để edit product
     * Không cần related products hay reviews
     */
    findById(id: string): Promise<{
        category: {
            type: import(".prisma/client").$Enums.CategoryType;
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            isActive: boolean;
            slug: string;
        } | null;
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
    }>;
    /**
     * create - Tạo sản phẩm mới (Admin only)
     *
     * Sử dụng Prisma Transaction để đảm bảo:
     * - Tạo product VÀ images trong cùng 1 transaction
     * - Nếu 1 trong 2 fail → rollback cả 2
     *
     * @param data - Product data
     * @param images - Array of image objects
     */
    create(data: CreateProductDto, images?: ProductImage[]): Promise<({
        category: {
            type: import(".prisma/client").$Enums.CategoryType;
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            isActive: boolean;
            slug: string;
        } | null;
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
    }) | null>;
    /**
     * update - Cập nhật sản phẩm (Admin only)
     *
     * Hỗ trợ partial update (chỉ update fields được truyền)
     * Nếu có images mới → xóa images cũ, thêm mới
     *
     * @param id - Product ID
     * @param data - Product data cần update
     * @param newImages - Images mới (optional, nếu có sẽ replace tất cả)
     */
    update(id: string, data: UpdateProductDto, newImages?: ProductImage[]): Promise<({
        category: {
            type: import(".prisma/client").$Enums.CategoryType;
            id: string;
            name: string;
            description: string | null;
            parentId: string | null;
            isActive: boolean;
            slug: string;
        } | null;
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
    }) | null>;
    /**
     * delete - Xóa sản phẩm (Admin only)
     *
     * LOGIC:
     * - Nếu sản phẩm ĐÃ có đơn hàng → Soft delete (chuyển DISCONTINUED)
     * - Nếu sản phẩm CHƯA có đơn hàng → Hard delete (xóa hẳn)
     *
     * Lý do: Không thể xóa sản phẩm đã bán để giữ lịch sử đơn hàng
     */
    delete(id: string): Promise<{
        message: string;
    }>;
};
export {};
//# sourceMappingURL=product.service.d.ts.map