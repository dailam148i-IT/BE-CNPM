/**
 * =============================================================================
 * NEWS.SERVICE.TS - Business Logic cho Tin tức/Bài viết
 * =============================================================================
 * 
 * Service này xử lý tất cả logic liên quan đến tin tức và bài viết
 * 
 * NHIỆM VỤ:
 * - CRUD tin tức (tạo, đọc, sửa, xóa)
 * - Tự động tạo slug từ tiêu đề
 * - Quản lý trạng thái (DRAFT, PUBLISHED, HIDDEN)
 * - Cập nhật ngày publish khi chuyển trạng thái
 * 
 * QUY TẮC:
 * - Người dùng thường chỉ thấy bài viết PUBLISHED
 * - Admin/Staff thấy tất cả trạng thái
 * - Slug phải duy nhất (tự động thêm số nếu trùng)
 */

import prisma from '../../config/database.js';
import { NotFoundError } from '../../middleware/errorHandler.js';
import slugify from 'slugify';

/**
 * Interface cho dữ liệu tạo tin tức mới
 */
interface CreateNewsData {
  authorId: string;    // ID của người viết bài
  title: string;       // Tiêu đề bài viết
  description?: string | null;  // Mô tả ngắn
  content?: string | null;      // Nội dung chi tiết
  categoryId?: string | null;   // Danh mục tin tức
  imageUrl?: string | null;     // Ảnh đại diện
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';  // Trạng thái
}

interface UpdateNewsData {
  title?: string;
  description?: string | null;
  content?: string | null;
  categoryId?: string | null;
  imageUrl?: string | null;
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
}

interface QueryOptions {
  page?: number;
  limit?: number;
  status?: 'DRAFT' | 'PUBLISHED' | 'HIDDEN';
  categoryId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'publishedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export const newsService = {
  /**
   * Lấy danh sách tin tức
   */
  async findAll(options: QueryOptions = {}, isAdmin: boolean = false) {
    const {
      page = 1,
      limit = 10,
      status,
      categoryId,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = options;

    // Build where
    const where: any = {};
    
    // Non-admin chỉ xem PUBLISHED
    if (!isAdmin) {
      where.status = 'PUBLISHED';
    } else if (status) {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Query
    const [news, total] = await Promise.all([
      prisma.news.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, username: true, fullName: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.news.count({ where }),
    ]);

    return {
      news,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Lấy tin tức theo ID
   */
  async findById(id: string) {
    const news = await prisma.news.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, username: true, fullName: true } },
      },
    });

    if (!news) {
      throw new NotFoundError('Bài viết không tồn tại');
    }

    return news;
  },

  /**
   * Lấy tin tức theo slug (public)
   */
  async findBySlug(slug: string) {
    const news = await prisma.news.findUnique({
      where: { slug },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, username: true, fullName: true } },
      },
    });

    if (!news || news.status !== 'PUBLISHED') {
      throw new NotFoundError('Bài viết không tồn tại');
    }

    return news;
  },

  /**
   * Tạo tin tức mới
   */
  async create(data: CreateNewsData) {
    const { title, authorId, ...rest } = data;

    // Generate unique slug
    let baseSlug = slugify(title, { lower: true, strict: true, locale: 'vi' });
    let slug = baseSlug;
    let counter = 1;

    while (await prisma.news.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const news = await prisma.news.create({
      data: {
        title,
        slug,
        authorId,
        ...rest,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : undefined,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, username: true, fullName: true } },
      },
    });

    return news;
  },

  /**
   * Cập nhật tin tức
   */
  async update(id: string, data: UpdateNewsData) {
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Bài viết không tồn tại');
    }

    // Update slug if title changed
    let slug = existing.slug;
    if (data.title && data.title !== existing.title) {
      let baseSlug = slugify(data.title, { lower: true, strict: true, locale: 'vi' });
      slug = baseSlug;
      let counter = 1;

      while (await prisma.news.findFirst({ where: { slug, id: { not: id } } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Update publishedAt if status changed to PUBLISHED
    let publishedAt = existing.publishedAt;
    if (data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      publishedAt = new Date();
    }

    const news = await prisma.news.update({
      where: { id },
      data: {
        ...data,
        slug,
        publishedAt,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, username: true, fullName: true } },
      },
    });

    return news;
  },

  /**
   * Xóa tin tức
   */
  async delete(id: string) {
    const existing = await prisma.news.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Bài viết không tồn tại');
    }

    await prisma.news.delete({ where: { id } });

    return { message: 'Đã xóa bài viết thành công' };
  },
};
