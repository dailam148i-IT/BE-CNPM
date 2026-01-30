/**
 * Mock Data: News Module
 * - GET /api/news
 * - GET /api/news/:slug
 * - POST /api/news (Admin)
 * - PUT /api/news/:id (Admin)
 * - DELETE /api/news/:id (Admin)
 */

// ============ SAMPLE NEWS ============

export const sampleNews = {
  id: "news-uuid-1",
  categoryId: "cat-news-1",
  authorId: "admin-uuid",
  title: "Lợi ích sức khỏe của Trà Ô Long",
  slug: "loi-ich-suc-khoe-cua-tra-o-long",
  description: "Khám phá những lợi ích tuyệt vời của trà Ô Long đối với sức khỏe.",
  content: "<p>Trà Ô Long là một loại trà...</p>",
  imageUrl: "https://cdn.example.com/news1.jpg",
  publishedAt: "2026-01-25T08:00:00.000Z",
  status: "PUBLISHED",
  category: { id: "cat-news-1", name: "Tin tức", slug: "tin-tuc" },
  author: { fullName: "Admin System" }
};

// ============ GET NEWS LIST ============

export const getNewsSuccess = {
  endpoint: "GET /api/news",
  description: "Lấy danh sách bài viết",
  query: { page: 1, limit: 10 },
  response: {
    success: true,
    data: {
      news: [
        sampleNews,
        {
          id: "news-uuid-2",
          title: "Cách pha trà Ô Long chuẩn vị",
          slug: "cach-pha-tra-o-long-chuan-vi",
          description: "Hướng dẫn pha trà Ô Long đúng cách.",
          imageUrl: "https://cdn.example.com/news2.jpg",
          publishedAt: "2026-01-20T00:00:00.000Z",
          status: "PUBLISHED",
          author: { fullName: "Admin System" }
        }
      ],
      pagination: { page: 1, limit: 10, total: 20, totalPages: 2 }
    }
  },
  statusCode: 200
};

// ============ GET NEWS DETAIL ============

export const getNewsBySlugSuccess = {
  endpoint: "GET /api/news/:slug",
  description: "Lấy chi tiết bài viết",
  params: { slug: "loi-ich-suc-khoe-cua-tra-o-long" },
  response: {
    success: true,
    data: {
      ...sampleNews,
      relatedNews: [
        { id: "news-2", title: "Cách pha trà", slug: "cach-pha-tra", imageUrl: "..." }
      ]
    }
  },
  statusCode: 200
};

export const getNewsBySlugNotFound = {
  endpoint: "GET /api/news/:slug",
  description: "Bài viết không tồn tại",
  params: { slug: "bai-viet-khong-ton-tai" },
  response: {
    success: false,
    message: "Không tìm thấy bài viết"
  },
  statusCode: 404
};

// ============ CREATE NEWS (Admin) ============

export const createNewsSuccess = {
  endpoint: "POST /api/news",
  description: "Tạo bài viết mới",
  headers: { Authorization: "Bearer admin-token" },
  request: {
    title: "Bài viết mới",
    description: "Mô tả ngắn",
    content: "<p>Nội dung bài viết</p>",
    categoryId: "cat-news-1",
    imageUrl: "https://cdn.example.com/new-image.jpg",
    status: "PUBLISHED"
  },
  response: {
    success: true,
    data: {
      id: "new-news-uuid",
      title: "Bài viết mới",
      slug: "bai-viet-moi",
      status: "PUBLISHED"
    }
  },
  statusCode: 201
};

// ============ DELETE NEWS (Admin) ============

export const deleteNewsSuccess = {
  endpoint: "DELETE /api/news/:id",
  description: "Xóa bài viết",
  params: { id: "news-uuid-1" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    message: "Xóa bài viết thành công"
  },
  statusCode: 200
};
