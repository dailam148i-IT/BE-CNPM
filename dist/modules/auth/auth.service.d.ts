/**
 * =============================================================================
 * AUTH.SERVICE.TS - Business Logic cho Authentication
 * =============================================================================
 *
 * File này chứa tất cả logic xử lý:
 * - Đăng ký tài khoản
 * - Đăng nhập (tạo tokens)
 * - Refresh token
 * - Đăng xuất (xóa session)
 * - Đổi mật khẩu
 *
 * NGUYÊN TẮC:
 * - Service KHÔNG biết về req/res (Express)
 * - Service chỉ nhận data thuần và trả về data thuần
 * - Các lỗi được throw dưới dạng AppError
 * - Controller sẽ bắt lỗi và trả response
 */
import type { RegisterDto, LoginDto, ChangePasswordDto } from './auth.schema.js';
/**
 * Interface cho kết quả đăng nhập
 * CHỈ trả về data tối thiểu cần thiết (bảo mật)
 */
interface LoginResult {
    user: {
        id: string;
        username: string;
        email: string;
        role: {
            name: string;
        };
    };
    accessToken: string;
    refreshToken: string;
}
/**
 * =============================================================================
 * AUTH SERVICE OBJECT
 * =============================================================================
 *
 * Tất cả methods được định nghĩa trong 1 object
 * Có thể chuyển sang class nếu cần dependency injection
 */
export declare const authService: {
    /**
     * ===========================================================================
     * REGISTER - Đăng ký tài khoản mới
     * ===========================================================================
     *
     * @param data - Dữ liệu đăng ký (đã validate)
     * @returns User mới tạo (không có password)
     * @throws AppError nếu email/username đã tồn tại
     *
     * Flow:
     * 1. Kiểm tra email đã tồn tại chưa
     * 2. Kiểm tra username đã tồn tại chưa
     * 3. Hash password
     * 4. Lấy role CUSTOMER
     * 5. Tạo user mới
     * 6. Trả về user (loại bỏ password)
     */
    register(data: RegisterDto): Promise<{
        role: {
            id: number;
            name: string;
            description: string | null;
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
        roleId: number;
    }>;
    /**
     * ===========================================================================
     * LOGIN - Đăng nhập
     * ===========================================================================
     *
     * @param data - Email và password
     * @returns User info + Access Token + Refresh Token
     * @throws UnauthorizedError nếu sai email/password
     *
     * Flow:
     * 1. Tìm user theo email
     * 2. Kiểm tra password
     * 3. Kiểm tra trạng thái tài khoản
     * 4. Tạo Access Token (15 phút)
     * 5. Tạo Refresh Token (7 ngày)
     * 6. Lưu session vào database
     * 7. Trả về user + tokens
     */
    login(data: LoginDto): Promise<LoginResult>;
    /**
     * ===========================================================================
     * REFRESH TOKEN - Tạo mới Access Token
     * ===========================================================================
     *
     * @param refreshToken - Refresh token từ cookie hoặc body
     * @returns Access Token mới + Refresh Token mới (token rotation)
     * @throws UnauthorizedError nếu token không hợp lệ
     *
     * Token Rotation:
     * - Mỗi lần refresh, tạo refresh token MỚI
     * - Token cũ bị revoke
     * - Bảo mật cao hơn: nếu token bị steal, chỉ dùng được 1 lần
     */
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    /**
     * ===========================================================================
     * LOGOUT - Đăng xuất
     * ===========================================================================
     *
     * @param refreshToken - Token cần revoke
     * @param userId - ID user (từ access token)
     *
     * Revoke tất cả sessions của user với refresh token này
     */
    logout(refreshToken: string | undefined, userId: string): Promise<void>;
    /**
     * ===========================================================================
     * GET PROFILE - Lấy thông tin user
     * ===========================================================================
     *
     * @param userId - ID user từ token
     * @returns User info (không có password)
     */
    getProfile(userId: string): Promise<{
        role: {
            id: number;
            name: string;
            description: string | null;
        };
        addresses: {
            phone: string | null;
            id: string;
            createdAt: Date;
            userId: string;
            recipientName: string | null;
            address: string;
            isDefault: boolean;
        }[];
        username: string;
        email: string;
        fullName: string | null;
        phone: string | null;
        status: import(".prisma/client").$Enums.UserStatus;
        id: string;
        dateOfBirth: Date | null;
        createdAt: Date;
        updatedAt: Date;
        roleId: number;
    }>;
    /**
     * ===========================================================================
     * CHANGE PASSWORD - Đổi mật khẩu
     * ===========================================================================
     *
     * @param userId - ID user
     * @param data - Mật khẩu cũ và mới
     */
    changePassword(userId: string, data: ChangePasswordDto): Promise<void>;
};
export {};
//# sourceMappingURL=auth.service.d.ts.map