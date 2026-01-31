/**
 * =============================================================================
 * USER.SERVICE.TS - Business Logic cho Quản lý Users (Admin)
 * =============================================================================
 * 
 * Service này xử lý tất cả logic quản lý người dùng dành cho Admin
 * 
 * NHIỆM VỤ:
 * - Liệt kê danh sách users với filter và pagination
 * - Xem chi tiết thông tin user
 * - Thay đổi trạng thái user (block/unblock)
 * - Thay đổi role của user
 * 
 * QUY TẮC:
 * - Không thể block/unblock Admin
 * - Chỉ Admin mới có quyền thay đổi role
 * - Mật khẩu không được trả về
 */

import prisma from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler.js';

/**
 * Interface cho các tùy chọn query users
 */
interface QueryOptions {
  page?: number;       // Trang hiện tại (mặc định: 1)
  limit?: number;      // Số lượng mỗi trang (mặc định: 20)
  status?: 'ACTIVE' | 'INACTIVE' | 'BANNED';  // Lọc theo trạng thái
  roleId?: number;     // Lọc theo role
  search?: string;     // Tìm kiếm theo username, email, phone, fullName
  sortBy?: 'createdAt' | 'username' | 'email';  // Sắp xếp theo
  sortOrder?: 'asc' | 'desc';  // Thứ tự sắp xếp
}

export const userService = {
  /**
   * Lấy danh sách users (Admin)
   */
  async findAll(options: QueryOptions = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      roleId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { fullName: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          phone: true,
          status: true,
          createdAt: true,
          role: {
            select: { id: true, name: true },
          },
          _count: {
            select: { orders: true, reviews: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Lấy chi tiết user
   */
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        dateOfBirth: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: { id: true, name: true },
        },
        addresses: true,
        _count: {
          select: { orders: true, reviews: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User không tồn tại');
    }

    return user;
  },

  /**
   * Cập nhật status (block/unblock)
   */
  async updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE' | 'BANNED') {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User không tồn tại');
    }

    // Không cho block admin
    const userWithRole = await prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (userWithRole?.role.name === 'ADMIN') {
      throw new BadRequestError('Không thể thay đổi status của Admin');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        username: true,
        status: true,
      },
    });

    return updated;
  },

  /**
   * Cập nhật role
   */
  async updateRole(id: string, roleId: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundError('User không tồn tại');
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundError('Role không tồn tại');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { roleId },
      select: {
        id: true,
        username: true,
        role: {
          select: { id: true, name: true },
        },
      },
    });

    return updated;
  },

  /**
   * Lấy danh sách roles
   */
  async getRoles() {
    return prisma.role.findMany({
      orderBy: { id: 'asc' },
    });
  },
};
