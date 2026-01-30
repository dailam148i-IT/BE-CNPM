/**
 * Mock Data: Products Module
 * - GET /api/products
 * - GET /api/products/detail/:slug
 * - POST /api/products (Admin)
 * - PUT /api/products/:id (Admin)
 * - DELETE /api/products/:id (Admin)
 */

// ============ SAMPLE PRODUCT OBJECTS ============

export const sampleProduct = {
  id: "prod-uuid-1",
  categoryId: "cat-uuid-1",
  name: "Trà Ô Long Đài Loan",
  slug: "tra-o-long-dai-loan",
  description: "Trà Ô Long nhập khẩu từ Đài Loan, hương thơm đặc trưng.",
  shortDesc: "Trà Ô Long cao cấp",
  price: 250000,
  stockQuantity: 100,
  sku: "TOL-001",
  version: 0,
  status: "PUBLISHED",
  createdAt: "2026-01-15T00:00:00.000Z",
  updatedAt: "2026-01-20T00:00:00.000Z",
  category: { id: "cat-uuid-1", name: "Trà Ô Long", slug: "tra-o-long" },
  images: [
    { id: "img-1", imageUrl: "https://cdn.example.com/tea1.jpg", isThumbnail: true, sortOrder: 0 },
    { id: "img-2", imageUrl: "https://cdn.example.com/tea1-2.jpg", isThumbnail: false, sortOrder: 1 }
  ],
  thumbnail: "https://cdn.example.com/tea1.jpg",
  avgRating: 4.5,
  reviewCount: 25
};

// ============ GET PRODUCTS (Public) ============

export const getProductsSuccess = {
  endpoint: "GET /api/products",
  description: "Lấy danh sách sản phẩm thành công",
  query: { page: 1, limit: 12 },
  response: {
    success: true,
    data: {
      products: [
        { ...sampleProduct },
        {
          id: "prod-uuid-2",
          name: "Trà Ô Long Thiết Quan Âm",
          slug: "tra-o-long-thiet-quan-am",
          price: 350000,
          stockQuantity: 50,
          thumbnail: "https://cdn.example.com/tea2.jpg",
          avgRating: 4.8,
          reviewCount: 12
        }
      ],
      pagination: { page: 1, limit: 12, total: 50, totalPages: 5 }
    }
  },
  statusCode: 200
};

export const getProductsWithFilters = {
  endpoint: "GET /api/products",
  description: "Lấy sản phẩm với filter",
  query: {
    page: 1,
    limit: 12,
    categorySlug: "tra-o-long",
    minPrice: 200000,
    maxPrice: 400000,
    sortBy: "price",
    sortOrder: "asc"
  },
  response: {
    success: true,
    data: {
      products: [/* filtered products */],
      pagination: { page: 1, limit: 12, total: 10, totalPages: 1 }
    }
  },
  statusCode: 200
};

export const getProductsEmpty = {
  endpoint: "GET /api/products",
  description: "Không tìm thấy sản phẩm nào",
  query: { search: "không có sản phẩm này" },
  response: {
    success: true,
    data: {
      products: [],
      pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
    }
  },
  statusCode: 200
};

// ============ GET PRODUCT DETAIL ============

export const getProductBySlugSuccess = {
  endpoint: "GET /api/products/detail/:slug",
  description: "Lấy chi tiết sản phẩm thành công",
  params: { slug: "tra-o-long-dai-loan" },
  response: {
    success: true,
    data: {
      ...sampleProduct,
      reviews: [
        {
          id: "review-1",
          rating: 5,
          commentText: "Trà rất thơm, đóng gói đẹp!",
          createdAt: "2026-01-25T00:00:00.000Z",
          user: { fullName: "Khách hàng A" }
        },
        {
          id: "review-2",
          rating: 4,
          commentText: "Chất lượng tốt, giao hàng nhanh",
          createdAt: "2026-01-20T00:00:00.000Z",
          user: { fullName: "Khách hàng B" }
        }
      ],
      relatedProducts: [
        {
          id: "prod-uuid-2",
          name: "Trà Ô Long Thiết Quan Âm",
          slug: "tra-o-long-thiet-quan-am",
          price: 350000,
          images: [{ imageUrl: "https://cdn.example.com/tea2.jpg" }]
        }
      ]
    }
  },
  statusCode: 200
};

export const getProductBySlugNotFound = {
  endpoint: "GET /api/products/detail/:slug",
  description: "Sản phẩm không tồn tại",
  params: { slug: "san-pham-khong-ton-tai" },
  response: {
    success: false,
    message: "Không tìm thấy sản phẩm"
  },
  statusCode: 404
};

// ============ CREATE PRODUCT (Admin) ============

export const createProductSuccess = {
  endpoint: "POST /api/products",
  description: "Tạo sản phẩm mới thành công",
  headers: { Authorization: "Bearer admin-token" },
  request: {
    name: "Trà Xanh Thái Nguyên",
    description: "Trà xanh đặc sản Thái Nguyên",
    shortDesc: "Trà xanh cao cấp",
    price: 180000,
    stockQuantity: 200,
    sku: "TX-001",
    categoryId: "cat-uuid-2",
    status: "PUBLISHED",
    images: [
      { url: "https://cdn.example.com/new-tea.jpg", isThumbnail: true }
    ]
  },
  response: {
    success: true,
    data: {
      id: "new-prod-uuid",
      name: "Trà Xanh Thái Nguyên",
      slug: "tra-xanh-thai-nguyen",
      price: 180000,
      status: "PUBLISHED",
      images: [{ id: "new-img", imageUrl: "https://cdn.example.com/new-tea.jpg", isThumbnail: true }],
      category: { id: "cat-uuid-2", name: "Trà Xanh" }
    }
  },
  statusCode: 201
};

export const createProductDuplicate = {
  endpoint: "POST /api/products",
  description: "Tên sản phẩm đã tồn tại",
  headers: { Authorization: "Bearer admin-token" },
  request: {
    name: "Trà Ô Long Đài Loan", // Already exists
    price: 250000,
    categoryId: "cat-uuid-1"
  },
  response: {
    success: false,
    message: "Tên sản phẩm đã tồn tại"
  },
  statusCode: 400
};

// ============ UPDATE PRODUCT (Admin) ============

export const updateProductSuccess = {
  endpoint: "PUT /api/products/:id",
  description: "Cập nhật sản phẩm thành công",
  params: { id: "prod-uuid-1" },
  headers: { Authorization: "Bearer admin-token" },
  request: {
    name: "Trà Ô Long Đài Loan Premium",
    price: 280000,
    stockQuantity: 150
  },
  response: {
    success: true,
    data: {
      id: "prod-uuid-1",
      name: "Trà Ô Long Đài Loan Premium",
      slug: "tra-o-long-dai-loan-premium",
      price: 280000,
      stockQuantity: 150
    }
  },
  statusCode: 200
};

export const updateProductNotFound = {
  endpoint: "PUT /api/products/:id",
  description: "Sản phẩm không tồn tại",
  params: { id: "non-existent" },
  headers: { Authorization: "Bearer admin-token" },
  request: { price: 300000 },
  response: {
    success: false,
    message: "Không tìm thấy sản phẩm"
  },
  statusCode: 404
};

// ============ DELETE PRODUCT (Admin) ============

export const deleteProductSuccess = {
  endpoint: "DELETE /api/products/:id",
  description: "Xóa sản phẩm thành công (chưa có đơn hàng)",
  params: { id: "prod-uuid-new" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    message: "Xóa sản phẩm thành công"
  },
  statusCode: 200
};

export const deleteProductWithOrders = {
  endpoint: "DELETE /api/products/:id",
  description: "Sản phẩm có đơn hàng (soft delete)",
  params: { id: "prod-uuid-1" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    message: "Sản phẩm đã được ẩn (đã có đơn hàng)"
  },
  statusCode: 200
};
