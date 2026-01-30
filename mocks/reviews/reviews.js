/**
 * Mock Data: Reviews Module
 * - GET /api/reviews/product/:productId
 * - POST /api/reviews
 * - PUT /api/reviews/:id
 * - DELETE /api/reviews/:id
 */

// ============ GET PRODUCT REVIEWS ============

export const getReviewsSuccess = {
  endpoint: "GET /api/reviews/product/:productId",
  description: "Lấy đánh giá của sản phẩm",
  params: { productId: "prod-uuid-1" },
  query: { page: 1, limit: 10 },
  response: {
    success: true,
    data: {
      reviews: [
        {
          id: "review-1",
          userId: "user-uuid-1",
          productId: "prod-uuid-1",
          rating: 5,
          commentText: "Trà rất thơm ngon, đóng gói cẩn thận. Sẽ mua lại!",
          createdAt: "2026-01-25T00:00:00.000Z",
          user: { fullName: "Nguyễn Văn A" }
        },
        {
          id: "review-2",
          userId: "user-uuid-2",
          productId: "prod-uuid-1",
          rating: 4,
          commentText: "Chất lượng tốt, giao hàng nhanh. Trừ 1 sao vì giá hơi cao.",
          createdAt: "2026-01-20T00:00:00.000Z",
          user: { fullName: "Trần Thị B" }
        },
        {
          id: "review-3",
          userId: "user-uuid-3",
          productId: "prod-uuid-1",
          rating: 5,
          commentText: "Tuyệt vời!",
          createdAt: "2026-01-15T00:00:00.000Z",
          user: { fullName: "Lê Văn C" }
        }
      ],
      stats: {
        avgRating: 4.67,
        totalReviews: 25,
        distribution: {
          1: 1,
          2: 2,
          3: 3,
          4: 7,
          5: 12
        }
      },
      pagination: { page: 1, limit: 10, total: 25, totalPages: 3 }
    }
  },
  statusCode: 200
};

export const getReviewsEmpty = {
  endpoint: "GET /api/reviews/product/:productId",
  description: "Sản phẩm chưa có đánh giá",
  params: { productId: "new-product" },
  response: {
    success: true,
    data: {
      reviews: [],
      stats: {
        avgRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      },
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    }
  },
  statusCode: 200
};

// ============ CREATE REVIEW ============

export const createReviewSuccess = {
  endpoint: "POST /api/reviews",
  description: "Thêm đánh giá thành công",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "prod-uuid-3",
    rating: 5,
    comment: "Sản phẩm tuyệt vời, đúng như mô tả!"
  },
  response: {
    success: true,
    data: {
      id: "new-review-uuid",
      userId: "user-uuid-1",
      productId: "prod-uuid-3",
      rating: 5,
      commentText: "Sản phẩm tuyệt vời, đúng như mô tả!",
      createdAt: "2026-01-30T00:00:00.000Z",
      user: { fullName: "Nguyễn Văn A" }
    }
  },
  statusCode: 201
};

export const createReviewProductNotFound = {
  endpoint: "POST /api/reviews",
  description: "Sản phẩm không tồn tại",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "non-existent-product",
    rating: 5,
    comment: "Test"
  },
  response: {
    success: false,
    message: "Sản phẩm không tồn tại"
  },
  statusCode: 404
};

export const createReviewDuplicate = {
  endpoint: "POST /api/reviews",
  description: "Đã đánh giá sản phẩm này rồi",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "prod-uuid-1", // Already reviewed
    rating: 4,
    comment: "Muốn đánh giá lần 2"
  },
  response: {
    success: false,
    message: "Bạn đã đánh giá sản phẩm này"
  },
  statusCode: 400
};

export const createReviewInvalidRating = {
  endpoint: "POST /api/reviews",
  description: "Rating không hợp lệ",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "prod-uuid-3",
    rating: 10, // Should be 1-5
    comment: "Test"
  },
  response: {
    success: false,
    message: "Dữ liệu không hợp lệ",
    errors: [
      { field: "rating", message: "Rating phải từ 1 đến 5" }
    ]
  },
  statusCode: 400
};

export const createReviewUnauthorized = {
  endpoint: "POST /api/reviews",
  description: "Chưa đăng nhập",
  headers: {},
  request: {
    productId: "prod-uuid-3",
    rating: 5,
    comment: "Test"
  },
  response: {
    success: false,
    message: "Vui lòng đăng nhập"
  },
  statusCode: 401
};

// ============ UPDATE REVIEW ============

export const updateReviewSuccess = {
  endpoint: "PUT /api/reviews/:id",
  description: "Cập nhật đánh giá thành công",
  params: { id: "review-1" },
  headers: { Authorization: "Bearer user-token" }, // Owner of review-1
  request: {
    rating: 4,
    comment: "Cập nhật: Vẫn ngon nhưng giao hơi lâu"
  },
  response: {
    success: true,
    data: {
      id: "review-1",
      rating: 4,
      commentText: "Cập nhật: Vẫn ngon nhưng giao hơi lâu"
    }
  },
  statusCode: 200
};

export const updateReviewNotOwner = {
  endpoint: "PUT /api/reviews/:id",
  description: "Không phải người viết review",
  params: { id: "review-2" }, // Belongs to another user
  headers: { Authorization: "Bearer user-token" },
  request: { rating: 1 },
  response: {
    success: false,
    message: "Không tìm thấy đánh giá"
  },
  statusCode: 404
};

// ============ DELETE REVIEW ============

export const deleteReviewSuccess = {
  endpoint: "DELETE /api/reviews/:id",
  description: "Xóa đánh giá của mình",
  params: { id: "review-1" },
  headers: { Authorization: "Bearer user-token" }, // Owner
  response: {
    success: true,
    message: "Xóa đánh giá thành công"
  },
  statusCode: 200
};

export const deleteReviewByAdmin = {
  endpoint: "DELETE /api/reviews/:id",
  description: "Admin xóa đánh giá của người khác",
  params: { id: "review-2" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    message: "Xóa đánh giá thành công"
  },
  statusCode: 200
};

export const deleteReviewNotOwnerNotAdmin = {
  endpoint: "DELETE /api/reviews/:id",
  description: "Không phải owner và không phải admin",
  params: { id: "review-2" },
  headers: { Authorization: "Bearer other-user-token" },
  response: {
    success: false,
    message: "Không có quyền xóa đánh giá này"
  },
  statusCode: 403
};

export const deleteReviewNotFound = {
  endpoint: "DELETE /api/reviews/:id",
  description: "Review không tồn tại",
  params: { id: "non-existent-review" },
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: false,
    message: "Không tìm thấy đánh giá"
  },
  statusCode: 404
};
