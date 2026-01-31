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
import prisma from '../../config/database.js';
import slugify from 'slugify';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler.js';
export const categoryService = {
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
    async findAll(options = {}) {
        const { type, isActive, includeChildren = false } = options;
        // Xây dựng điều kiện WHERE động
        const where = {};
        if (type)
            where.type = type;
        if (isActive !== undefined)
            where.isActive = isActive;
        const categories = await prisma.category.findMany({
            where,
            include: {
                // Lấy thông tin parent (chỉ id và name)
                parent: { select: { id: true, name: true } },
                // Lấy children nếu được yêu cầu
                children: includeChildren
                    ? { select: { id: true, name: true, slug: true } }
                    : false,
                // Đếm số products và news trong mỗi category
                _count: {
                    select: { products: true, news: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        return categories;
    },
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
    async getTree(type = 'PRODUCT') {
        const categories = await prisma.category.findMany({
            where: {
                type: type,
                isActive: true,
                parentId: null, // Chỉ lấy root categories (cấp 1)
            },
            include: {
                // Nested include để lấy 3 cấp
                children: {
                    where: { isActive: true },
                    include: {
                        children: {
                            where: { isActive: true },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return categories;
    },
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
    async findBySlug(slug) {
        const category = await prisma.category.findUnique({
            where: { slug },
            include: {
                parent: true,
                children: true,
                // Lấy 10 sản phẩm published thuộc category này
                products: {
                    where: { status: 'PUBLISHED' },
                    take: 10,
                    include: {
                        images: { where: { isThumbnail: true }, take: 1 },
                    },
                },
            },
        });
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }
        return category;
    },
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
    async create(data) {
        // 1. Tạo slug từ name
        // slugify: chuyển "Trà Oolong Cao Cấp" → "tra-oolong-cao-cap"
        const slug = slugify(data.name, { lower: true, locale: 'vi', strict: true });
        // 2. Kiểm tra slug đã tồn tại chưa
        const existing = await prisma.category.findUnique({ where: { slug } });
        if (existing) {
            throw new BadRequestError('Slug đã tồn tại, vui lòng đổi tên');
        }
        // 3. Kiểm tra parent tồn tại (nếu có)
        if (data.parentId) {
            const parent = await prisma.category.findUnique({
                where: { id: data.parentId },
            });
            if (!parent) {
                throw new NotFoundError('Danh mục cha không tồn tại');
            }
        }
        // 4. Tạo category mới
        return prisma.category.create({
            data: {
                name: data.name,
                slug,
                description: data.description,
                parentId: data.parentId || null,
                type: data.type || 'PRODUCT',
                isActive: data.isActive ?? true, // Mặc định active
            },
        });
    },
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
    async update(id, data) {
        // 1. Kiểm tra category tồn tại
        const category = await prisma.category.findUnique({ where: { id } });
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }
        // 2. Build update data (chỉ update fields được truyền)
        const updateData = {};
        if (data.name) {
            updateData.name = data.name;
            updateData.slug = slugify(data.name, { lower: true, locale: 'vi', strict: true });
            // Kiểm tra slug mới không trùng với category khác
            const existing = await prisma.category.findFirst({
                where: {
                    slug: updateData.slug,
                    id: { not: id }, // Loại trừ chính nó
                },
            });
            if (existing) {
                throw new BadRequestError('Slug đã tồn tại');
            }
        }
        // Update các fields khác nếu được truyền
        if (data.description !== undefined)
            updateData.description = data.description;
        if (data.parentId !== undefined)
            updateData.parentId = data.parentId;
        if (data.isActive !== undefined)
            updateData.isActive = data.isActive;
        if (data.type !== undefined)
            updateData.type = data.type;
        // 3. Thực hiện update
        return prisma.category.update({
            where: { id },
            data: updateData,
        });
    },
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
    async delete(id) {
        // 1. Lấy category với count products và children
        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: { select: { products: true, children: true } },
            },
        });
        if (!category) {
            throw new NotFoundError('Không tìm thấy danh mục');
        }
        // 2. Kiểm tra có products không
        if (category._count.products > 0) {
            throw new BadRequestError('Không thể xóa danh mục có sản phẩm');
        }
        // 3. Kiểm tra có children không
        if (category._count.children > 0) {
            throw new BadRequestError('Không thể xóa danh mục có danh mục con');
        }
        // 4. Xóa category
        await prisma.category.delete({ where: { id } });
        return { message: 'Xóa danh mục thành công' };
    },
};
//# sourceMappingURL=category.service.js.map