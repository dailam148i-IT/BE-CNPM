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
import prisma from '../../config/database.js';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../middleware/errorHandler.js';
export const reviewService = {
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
    async findByProduct(productId, options = {}) {
        const { page = 1, limit = 10, rating, sortBy = 'createdAt', sortOrder = 'desc', } = options;
        // Check product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true },
        });
        if (!product) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }
        // Build where clause
        const where = { productId };
        if (rating) {
            where.rating = rating;
        }
        // Execute queries
        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true,
                            fullName: true,
                        },
                    },
                },
                orderBy: { [sortBy]: sortOrder },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.review.count({ where }),
        ]);
        // Get rating distribution
        const ratingStats = await prisma.review.groupBy({
            by: ['rating'],
            where: { productId },
            _count: { rating: true },
        });
        const distribution = [1, 2, 3, 4, 5].map((r) => {
            const stat = ratingStats.find((s) => s.rating === r);
            return { rating: r, count: stat?._count.rating || 0 };
        });
        // Calculate average
        const avgResult = await prisma.review.aggregate({
            where: { productId },
            _avg: { rating: true },
            _count: { rating: true },
        });
        return {
            reviews,
            stats: {
                avgRating: Math.round((avgResult._avg.rating || 0) * 10) / 10,
                totalReviews: avgResult._count.rating,
                distribution,
            },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    },
    /**
     * Tạo review mới
     */
    async create(data) {
        const { userId, productId, rating, commentText } = data;
        // Check product exists
        const product = await prisma.product.findUnique({
            where: { id: productId },
            select: { id: true, name: true },
        });
        if (!product) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }
        // Check if user already reviewed this product
        const existingReview = await prisma.review.findUnique({
            where: {
                userId_productId: { userId, productId },
            },
        });
        if (existingReview) {
            throw new BadRequestError('Bạn đã đánh giá sản phẩm này rồi');
        }
        // Create review
        const review = await prisma.review.create({
            data: {
                userId,
                productId,
                rating,
                commentText,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        });
        return review;
    },
    /**
     * Cập nhật review
     */
    async update(reviewId, userId, data) {
        // Find review
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review) {
            throw new NotFoundError('Review không tồn tại');
        }
        // Check ownership
        if (review.userId !== userId) {
            throw new ForbiddenError('Bạn không có quyền sửa review này');
        }
        // Update
        const updated = await prisma.review.update({
            where: { id: reviewId },
            data: {
                ...(data.rating !== undefined && { rating: data.rating }),
                ...(data.commentText !== undefined && { commentText: data.commentText }),
            },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true,
                        fullName: true,
                    },
                },
            },
        });
        return updated;
    },
    /**
     * Xóa review
     */
    async delete(reviewId, userId, isAdmin = false) {
        // Find review
        const review = await prisma.review.findUnique({
            where: { id: reviewId },
        });
        if (!review) {
            throw new NotFoundError('Review không tồn tại');
        }
        // Check ownership or admin
        if (review.userId !== userId && !isAdmin) {
            throw new ForbiddenError('Bạn không có quyền xóa review này');
        }
        await prisma.review.delete({
            where: { id: reviewId },
        });
        return { message: 'Đã xóa review thành công' };
    },
    /**
     * Lấy review của user cho product (check đã review chưa)
     */
    async findUserReview(userId, productId) {
        return prisma.review.findUnique({
            where: {
                userId_productId: { userId, productId },
            },
        });
    },
};
//# sourceMappingURL=review.service.js.map