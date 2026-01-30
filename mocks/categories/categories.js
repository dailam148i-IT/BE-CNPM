/**
 * Mock Data: Categories Module
 * - GET /api/categories
 * - GET /api/categories/tree
 * - GET /api/categories/:slug
 * - POST /api/categories (Admin)
 * - PUT /api/categories/:id (Admin)
 * - DELETE /api/categories/:id (Admin)
 */

// ============ SAMPLE CATEGORY ============

export const sampleCategory = {
  id: "cat-uuid-1",
  name: "Trà Ô Long",
  slug: "tra-o-long",
  description: "Trà Ô Long cao cấp nhập khẩu",
  parentId: null,
  isActive: true,
  type: "PRODUCT",
  parent: null,
  children: [
    { id: "cat-child-1", name: "Ô Long Đài Loan", slug: "o-long-dai-loan" },
    { id: "cat-child-2", name: "Ô Long Phúc Kiến", slug: "o-long-phuc-kien" }
  ],
  _count: { products: 15, news: 0 }
};

// ============ GET CATEGORIES ============

export const getCategoriesSuccess = {
  endpoint: "GET /api/categories",
  description: "Lấy tất cả categories",
  query: { type: "PRODUCT", isActive: true },
  response: {
    success: true,
    data: [
      { ...sampleCategory },
      {
        id: "cat-uuid-2",
        name: "Trà Xanh",
        slug: "tra-xanh",
        description: "Trà xanh Việt Nam",
        parentId: null,
        isActive: true,
        type: "PRODUCT",
        _count: { products: 10, news: 0 }
      },
      {
        id: "cat-uuid-3",
        name: "Hồng Trà",
        slug: "hong-tra",
        description: "Hồng trà đậm đà",
        parentId: null,
        isActive: true,
        type: "PRODUCT",
        _count: { products: 8, news: 0 }
      }
    ]
  },
  statusCode: 200
};

// ============ GET CATEGORY TREE ============

export const getCategoryTreeSuccess = {
  endpoint: "GET /api/categories/tree",
  description: "Lấy danh mục dạng cây (cho menu)",
  query: { type: "PRODUCT" },
  response: {
    success: true,
    data: [
      {
        id: "cat-uuid-1",
        name: "Trà Ô Long",
        slug: "tra-o-long",
        children: [
          { id: "cat-child-1", name: "Ô Long Đài Loan", slug: "o-long-dai-loan", children: [] },
          { id: "cat-child-2", name: "Ô Long Phúc Kiến", slug: "o-long-phuc-kien", children: [] }
        ]
      },
      {
        id: "cat-uuid-2",
        name: "Trà Xanh",
        slug: "tra-xanh",
        children: []
      }
    ]
  },
  statusCode: 200
};

// ============ GET CATEGORY BY SLUG ============

export const getCategoryBySlugSuccess = {
  endpoint: "GET /api/categories/:slug",
  description: "Lấy chi tiết danh mục kèm sản phẩm",
  params: { slug: "tra-o-long" },
  response: {
    success: true,
    data: {
      ...sampleCategory,
      products: [
        {
          id: "prod-1",
          name: "Trà Ô Long Đài Loan",
          slug: "tra-o-long-dai-loan",
          price: 250000,
          images: [{ imageUrl: "https://cdn.example.com/tea1.jpg" }]
        }
      ]
    }
  },
  statusCode: 200
};

export const getCategoryBySlugNotFound = {
  endpoint: "GET /api/categories/:slug",
  description: "Danh mục không tồn tại",
  params: { slug: "danh-muc-khong-ton-tai" },
  response: {
    success: false,
    message: "Không tìm thấy danh mục"
  },
  statusCode: 404
};

// ============ CREATE CATEGORY (Admin) ============

export const createCategorySuccess = {
  endpoint: "POST /api/categories",
  description: "Tạo danh mục mới",
  headers: { Authorization: "Bearer admin-token" },
  request: {
    name: "Trà Thảo Mộc",
    description: "Trà từ các loại thảo mộc tự nhiên",
    type: "PRODUCT",
    isActive: true
  },
  response: {
    success: true,
    data: {
      id: "new-cat-uuid",
      name: "Trà Thảo Mộc",
      slug: "tra-thao-moc",
      description: "Trà từ các loại thảo mộc tự nhiên",
      parentId: null,
      isActive: true,
      type: "PRODUCT"
    }
  },
  statusCode: 201
};

export const createSubcategorySuccess = {
  endpoint: "POST /api/categories",
  description: "Tạo danh mục con",
  headers: { Authorization: "Bearer admin-token" },
  request: {
    name: "Ô Long Kim Tuyên",
    description: "Ô Long cao cấp",
    parentId: "cat-uuid-1", // Parent: Trà Ô Long
    type: "PRODUCT"
  },
  response: {
    success: true,
    data: {
      id: "new-subcat-uuid",
      name: "Ô Long Kim Tuyên",
      slug: "o-long-kim-tuyen",
      parentId: "cat-uuid-1"
    }
  },
  statusCode: 201
};

export const createCategoryDuplicateSlug = {
  endpoint: "POST /api/categories",
  description: "Slug đã tồn tại",
  headers: { Authorization: "Bearer admin-token" },
  request: {
    name: "Trà Ô Long" // Will generate duplicate slug
  },
  response: {
    success: false,
    message: "Slug đã tồn tại, vui lòng đổi tên"
  },
  statusCode: 400
};

// ============ DELETE CATEGORY (Admin) ============

export const deleteCategorySuccess = {
  endpoint: "DELETE /api/categories/:id",
  description: "Xóa danh mục trống",
  params: { id: "empty-cat-uuid" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    message: "Xóa danh mục thành công"
  },
  statusCode: 200
};

export const deleteCategoryWithProducts = {
  endpoint: "DELETE /api/categories/:id",
  description: "Không thể xóa danh mục có sản phẩm",
  params: { id: "cat-uuid-1" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: false,
    message: "Không thể xóa danh mục có sản phẩm"
  },
  statusCode: 400
};

export const deleteCategoryWithChildren = {
  endpoint: "DELETE /api/categories/:id",
  description: "Không thể xóa danh mục có danh mục con",
  params: { id: "parent-cat-uuid" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: false,
    message: "Không thể xóa danh mục có danh mục con"
  },
  statusCode: 400
};
