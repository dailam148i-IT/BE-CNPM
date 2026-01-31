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
/**
 * Interface cho các tùy chọn query users
 */
interface QueryOptions {
    page?: number;
    limit?: number;
    status?: 'ACTIVE' | 'INACTIVE' | 'BANNED';
    roleId?: number;
    search?: string;
    sortBy?: 'createdAt' | 'username' | 'email';
    sortOrder?: 'asc' | 'desc';
}
export declare const userService: {
    /**
     * Lấy danh sách users (Admin)
     */
    findAll(options?: QueryOptions): Promise<{
        users: {
            role: {
                id: number;
                name: string;
            };
            username: string;
            email: string;
            fullName: string | null;
            phone: string | null;
            status: import(".prisma/client").$Enums.UserStatus;
            id: string;
            createdAt: Date;
            _count: {
                orders: number;
                reviews: number;
            };
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    /**
     * Lấy chi tiết user
     */
    findById(id: string): Promise<{
        role: {
            id: number;
            name: string;
        };
        username: string;
        email: string;
        fullName: string | null;
        phone: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        dateOfBirth: Date | null;
        createdAt: Date;
        updatedAt: Date;
        addresses: {
            phone: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            recipientName: string | null;
            address: string;
            isDefault: boolean;
        }[];
        _count: {
            orders: number;
            reviews: number;
        };
    }>;
    /**
     * Cập nhật status (block/unblock)
     */
    updateStatus(id: string, status: "ACTIVE" | "INACTIVE" | "BANNED"): Promise<{
        username: string;
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
    }>;
    /**
     * Cập nhật role
     */
    updateRole(id: string, roleId: number): Promise<{
        role: {
            id: number;
            name: string;
        };
        username: string;
        id: string;
    }>;
    /**
     * Lấy danh sách roles
     */
    getRoles(): Promise<{
        id: number;
        name: string;
        description: string | null;
    }[]>;
};
export {};
//# sourceMappingURL=user.service.d.ts.map