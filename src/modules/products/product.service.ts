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

import prisma from '../../config/database.js';
import slugify from 'slugify';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler.js';
import type { CreateProductDto, UpdateProductDto, ProductQueryDto } from './product.schema.js';

/**
 * Interface cho product images
 * Dùng khi create/update product với nhiều ảnh
 */
interface ProductImage {
  url: string;           // URL ảnh (từ Cloudinary hoặc storage)
  isThumbnail?: boolean; // Có phải ảnh đại diện không
  sortOrder?: number;    // Thứ tự hiển thị
}

export const productService = {
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
  async findAll(options: ProductQueryDto) {
    const {
      page = 1,
      limit = 12,
      status,
      categoryId,
      categorySlug,
      minPrice,
      maxPrice,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // ====================================
    // BUILD WHERE CLAUSE
    // ====================================
    const where: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by category (ưu tiên categoryId, nếu không có thì dùng slug)
    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      // Lấy categoryId từ slug
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
      });
      if (category) {
        where.categoryId = category.id;
      }
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice; // >= minPrice
      if (maxPrice) where.price.lte = maxPrice; // <= maxPrice
    }

    // Full-text search trong name, description, shortDesc
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { shortDesc: { contains: search } },
      ];
    }

    // ====================================
    // BUILD ORDER BY
    // ====================================
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // ====================================
    // EXECUTE QUERIES - OPTIMIZED (1 query thay vì N+1)
    // ====================================
    const [products, total] = await Promise.all([
      // Query 1: Lấy products với reviews để tính avgRating trong JS
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          images: {
            where: { isThumbnail: true },
            take: 1,
          },
          reviews: { select: { rating: true } }, // Lấy ratings để tính trung bình
          _count: { select: { reviews: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      // Query 2: Đếm tổng số products (cho pagination info)
      prisma.product.count({ where }),
    ]);

    // ====================================
    // CALCULATE RATINGS IN JS (No N+1!)
    // ====================================
    const productsWithRating = products.map((product) => {
      const ratings = product.reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0;

      return {
        ...product,
        thumbnail: product.images[0]?.imageUrl || null,
        avgRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
        reviewCount: product._count.reviews,
        reviews: undefined, // Remove raw reviews from response
      };
    });

    // ====================================
    // RETURN RESULT
    // ====================================
    return {
      products: productsWithRating,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * findBySlug - Lấy chi tiết sản phẩm theo slug (Public)
   * 
   * Dùng cho trang product detail
   * Include nhiều data: reviews, related products, rating stats
   * 
   * @param slug - URL-friendly string (VD: "tra-oolong-cao-cap")
   * @throws NotFoundError nếu không tìm thấy
   */
  async findBySlug(slug: string) {
    // 1. Lấy product với category và images
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } }, // Sắp xếp theo thứ tự
      },
    });

    if (!product) {
      throw new NotFoundError('Không tìm thấy sản phẩm');
    }

    // 2. Lấy reviews với thông tin user
    const reviews = await prisma.review.findMany({
      where: { productId: product.id },
      include: {
        user: { select: { fullName: true } }, // Chỉ lấy tên user
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Chỉ lấy 10 reviews mới nhất
    });

    // 3. Tính rating statistics
    const ratingStats = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },   // Rating trung bình
      _count: { id: true },      // Tổng số reviews
    });

    // 4. Lấy sản phẩm liên quan (cùng category)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },  // Loại trừ chính nó
        status: 'PUBLISHED',
      },
      include: {
        images: { where: { isThumbnail: true }, take: 1 },
      },
      take: 4, // Lấy tối đa 4 sản phẩm liên quan
    });

    return {
      ...product,
      reviews,
      avgRating: ratingStats._avg.rating || 0,
      reviewCount: ratingStats._count.id,
      relatedProducts,
    };
  },

  /**
   * findById - Lấy chi tiết theo ID (Admin only)
   * 
   * Dùng trong admin panel để edit product
   * Không cần related products hay reviews
   */
  async findById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundError('Không tìm thấy sản phẩm');
    }

    return product;
  },

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
  async create(data: CreateProductDto, images: ProductImage[] = []) {
    // 1. Tạo slug từ name
    const slug = slugify(data.name, { lower: true, locale: 'vi', strict: true });

    // 2. Kiểm tra slug đã tồn tại chưa
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestError('Tên sản phẩm đã tồn tại');
    }

    // 3. Transaction: Tạo product + images
    return prisma.$transaction(async (tx) => {
      // 3a. Tạo product
      const product = await tx.product.create({
        data: {
          name: data.name,
          slug,
          description: data.description,
          shortDesc: data.shortDesc,
          price: data.price,
          stockQuantity: data.stockQuantity || 0,
          sku: data.sku,
          status: data.status || 'DRAFT',
          categoryId: data.categoryId,
        },
      });

      // 3b. Tạo images nếu có
      if (images.length > 0) {
        await tx.productImage.createMany({
          data: images.map((img, index) => ({
            productId: product.id,
            imageUrl: img.url,
            isThumbnail: img.isThumbnail ?? index === 0, // Ảnh đầu tiên mặc định là thumbnail
            sortOrder: img.sortOrder ?? index,
          })),
        });
      }

      // 3c. Return product với images
      return tx.product.findUnique({
        where: { id: product.id },
        include: { images: true, category: true },
      });
    });
  },

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
  async update(id: string, data: UpdateProductDto, newImages?: ProductImage[]) {
    // 1. Kiểm tra product tồn tại
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new NotFoundError('Không tìm thấy sản phẩm');
    }

    // 2. Transaction
    return prisma.$transaction(async (tx) => {
      // 2a. Build update data
      const updateData: any = {};

      if (data.name) {
        updateData.name = data.name;
        updateData.slug = slugify(data.name, { lower: true, locale: 'vi', strict: true });

        // Kiểm tra slug mới không trùng
        const existing = await tx.product.findFirst({
          where: {
            slug: updateData.slug,
            id: { not: id },
          },
        });
        if (existing) {
          throw new BadRequestError('Tên sản phẩm đã tồn tại');
        }
      }

      // Map các fields optional
      if (data.description !== undefined) updateData.description = data.description;
      if (data.shortDesc !== undefined) updateData.shortDesc = data.shortDesc;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.stockQuantity !== undefined) updateData.stockQuantity = data.stockQuantity;
      if (data.sku !== undefined) updateData.sku = data.sku;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;

      // 2b. Update product
      if (Object.keys(updateData).length > 0) {
        await tx.product.update({
          where: { id },
          data: updateData,
        });
      }

      // 2c. Update images nếu có
      if (newImages !== undefined) {
        // Xóa tất cả images cũ
        await tx.productImage.deleteMany({ where: { productId: id } });

        // Thêm images mới
        if (newImages.length > 0) {
          await tx.productImage.createMany({
            data: newImages.map((img, index) => ({
              productId: id,
              imageUrl: img.url,
              isThumbnail: img.isThumbnail ?? index === 0,
              sortOrder: img.sortOrder ?? index,
            })),
          });
        }
      }

      // 2d. Return updated product
      return tx.product.findUnique({
        where: { id },
        include: { images: true, category: true },
      });
    });
  },

  /**
   * delete - Xóa sản phẩm (Admin only)
   * 
   * LOGIC:
   * - Nếu sản phẩm ĐÃ có đơn hàng → Soft delete (chuyển DISCONTINUED)
   * - Nếu sản phẩm CHƯA có đơn hàng → Hard delete (xóa hẳn)
   * 
   * Lý do: Không thể xóa sản phẩm đã bán để giữ lịch sử đơn hàng
   */
  async delete(id: string) {
    // 1. Lấy product với count orderDetails
    const product = await prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { orderDetails: true } } },
    });

    if (!product) {
      throw new NotFoundError('Không tìm thấy sản phẩm');
    }

    // 2. Check có đơn hàng không
    if (product._count.orderDetails > 0) {
      // Soft delete: chỉ đổi status
      await prisma.product.update({
        where: { id },
        data: { status: 'DISCONTINUED' },
      });
      return { message: 'Sản phẩm đã được ẩn (đã có đơn hàng)' };
    }

    // 3. Hard delete: xóa hoàn toàn
    // Prisma sẽ tự xóa ProductImages do cascade
    await prisma.product.delete({ where: { id } });
    return { message: 'Xóa sản phẩm thành công' };
  },
};
