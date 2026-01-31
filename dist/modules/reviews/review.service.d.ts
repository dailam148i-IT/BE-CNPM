/**
 * =============================================================================
 * REVIEW.SERVICE.TS - Business Logic cho Đánh giá sản phẩm
 * =============================================================================
 *
 * Service này xử lý tất cả logic liên quan đến đánh giá sản phẩm
 *
 * NHIỆM VỤ:
 * - CRUD reviews (tạo, đọc, sửa, xóa)
 * - Tính toán rating trung bình và phân phối rating
 * - Kiểm tra quyền sở hữu review
 * - Ngăn user đánh giá trùng lặp
 *
 * QUY TẮC:
 * - Mỗi user chỉ được đánh giá 1 lần cho mỗi sản phẩm
 * - Chỉ owner hoặc admin mới được xóa review
 * - Rating từ 1-5 stars
 */
/**
 * Interface cho dữ liệu tạo review mới
 */
interface CreateReviewData {
    userId: string;
    productId: string;
    rating: number;
    commentText?: string | null;
}
/**
 * Interface cho dữ liệu cập nhật review
 */
interface UpdateReviewData {
    rating?: number;
    commentText?: string | null;
}
/**
 * Interface cho các tùy chọn query
 */
interface QueryOptions {
    page?: number;
    limit?: number;
    rating?: number;
    sortBy?: 'createdAt' | 'rating';
    sortOrder?: 'asc' | 'desc';
}
export declare const reviewService: {
    /**
     * LẤY DANH SÁCH REVIEWS CỦA SẢN PHẨM
     *
     * Trả về:
     * - Danh sách reviews với thông tin user
     * - Thống kê rating (trung bình, tổng số, phân phối 1-5 sao)
     * - Thông tin pagination
     *
     * @param productId - ID của sản phẩm
     * @param options - Các tùy chọn filter và pagination
     */
    findByProduct(productId: string, options?: QueryOptions): Promise<{
        reviews: ({
            user: {
                username: string;
                fullName: string | null;
                id: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            productId: string;
            rating: number;
            commentText: string | null;
        })[];
        stats: {
            avgRating: number;
            totalReviews: number;
            distribution: {
                rating: number;
                count: number;
            }[];
        };
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Tạo review mới
     */
    create(data: CreateReviewData): Promise<{
        user: {
            username: string;
            fullName: string | null;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
        rating: number;
        commentText: string | null;
    }>;
    /**
     * Cập nhật review
     */
    update(reviewId: string, userId: string, data: UpdateReviewData): Promise<{
        user: {
            username: string;
            fullName: string | null;
            id: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
        rating: number;
        commentText: string | null;
    }>;
    /**
     * Xóa review
     */
    delete(reviewId: string, userId: string, isAdmin?: boolean): Promise<{
        message: string;
    }>;
    /**
     * Lấy review của user cho product (check đã review chưa)
     */
    findUserReview(userId: string, productId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        productId: string;
        rating: number;
        commentText: string | null;
    } | null>;
};
export {};
//# sourceMappingURL=review.service.d.ts.map