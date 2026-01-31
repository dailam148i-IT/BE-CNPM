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

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/database.js';
import { 
  AppError, 
  UnauthorizedError, 
  NotFoundError 
} from '../../middleware/errorHandler.js';
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
export const authService = {
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
  async register(data: RegisterDto) {
    // 1. Kiểm tra email
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new AppError('Email đã được sử dụng', 400);
    }

    // 2. Kiểm tra username
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new AppError('Username đã được sử dụng', 400);
    }

    // 2.5. Kiểm tra phone (nếu có)
    if (data.phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone: data.phone },
      });

      if (existingPhone) {
        throw new AppError('Số điện thoại đã được sử dụng', 400);
      }
    }

    // 3. Hash password
    // bcrypt.hash(password, saltRounds)
    // saltRounds = 10 → đủ an toàn, cân bằng giữa security và performance
    const passwordHash = await bcrypt.hash(data.password, 10);

    // 4. Lấy role CUSTOMER (user đăng ký mặc định là customer)
    const customerRole = await prisma.role.findUnique({
      where: { name: 'CUSTOMER' },
    });

    if (!customerRole) {
      throw new AppError('Lỗi hệ thống: Role không tồn tại', 500);
    }

    // 5. Tạo user mới
    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        passwordHash,
        fullName: data.fullName || null,
        phone: data.phone || null,
        roleId: customerRole.id,
        status: 'ACTIVE',
      },
      // include: Lấy thêm relation
      include: {
        role: true,
      },
    });

    // 6. Loại bỏ passwordHash trước khi trả về
    // Destructuring: lấy passwordHash ra, phần còn lại là safeUser
    const { passwordHash: _, ...safeUser } = user;

    return safeUser;
  },

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
  async login(data: LoginDto): Promise<LoginResult> {
    // 1. Tìm user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { role: true },
    });

    // Không cho biết cụ thể email hay password sai (bảo mật)
    if (!user) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    // 2. So sánh password
    // bcrypt.compare sẽ hash input và so với hash trong DB
    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Email hoặc mật khẩu không đúng');
    }

    // 3. Kiểm tra status
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Tài khoản đã bị khóa hoặc chưa kích hoạt');
    }

    // 4. Tạo Access Token
    // Payload: dữ liệu được encode trong token
    // Secret: key để mã hóa/giải mã
    // Options: thời gian hết hạn
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' } // 15 phút
    );

    // 5. Tạo Refresh Token
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' } // 7 ngày
    );

    // 6. Hash refresh token và lưu vào session
    // Lý do hash: nếu DB bị leak, attacker không dùng được token
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
      },
    });

    // 7. Trả về CHỈ data tối thiểu cần thiết (bảo mật)
    // KHÔNG trả về: phone, fullName, dateOfBirth, createdAt, updatedAt, roleId
    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: {
          name: user.role.name,
        },
      },
      accessToken,
      refreshToken,
    };
  },

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
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // 1. Verify refresh token
    let payload: { userId: string };
    
    try {
      payload = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET!
      ) as { userId: string };
    } catch {
      throw new UnauthorizedError('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // 2. Tìm tất cả sessions của user
    const sessions = await prisma.session.findMany({
      where: {
        userId: payload.userId,
        revoked: false,
        expiresAt: { gt: new Date() }, // gt = greater than = chưa hết hạn
      },
    });

    // 3. Kiểm tra refresh token có match với session nào không
    let validSession = null;
    for (const session of sessions) {
      const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (isMatch) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      throw new UnauthorizedError('Refresh token không hợp lệ');
    }

    // 4. Lấy user info
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { role: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Tài khoản không tồn tại hoặc đã bị khóa');
    }

    // 5. Revoke session cũ
    await prisma.session.update({
      where: { id: validSession.id },
      data: { revoked: true },
    });

    // 6. Tạo tokens mới (Token Rotation)
    const newAccessToken = jwt.sign(
      { userId: user.id, role: user.role.name },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' } // 15 phút
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' } // 7 ngày
    );

    // 7. Lưu session mới
    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: newRefreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

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
  async logout(refreshToken: string | undefined, userId: string): Promise<void> {
    if (refreshToken) {
      // Tìm và revoke session có token này
      const sessions = await prisma.session.findMany({
        where: { userId, revoked: false },
      });

      for (const session of sessions) {
        const isMatch = await bcrypt.compare(refreshToken, session.refreshTokenHash);
        if (isMatch) {
          await prisma.session.update({
            where: { id: session.id },
            data: { revoked: true },
          });
          break;
        }
      }
    } else {
      // Không có refresh token → revoke tất cả sessions
      await prisma.session.updateMany({
        where: { userId, revoked: false },
        data: { revoked: true },
      });
    }
  },

  /**
   * ===========================================================================
   * GET PROFILE - Lấy thông tin user
   * ===========================================================================
   * 
   * @param userId - ID user từ token
   * @returns User info (không có password)
   */
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { 
        role: true,
        addresses: true, // Lấy luôn danh sách địa chỉ
      },
    });

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  },

  /**
   * ===========================================================================
   * CHANGE PASSWORD - Đổi mật khẩu
   * ===========================================================================
   * 
   * @param userId - ID user
   * @param data - Mật khẩu cũ và mới
   */
  async changePassword(userId: string, data: ChangePasswordDto): Promise<void> {
    // 1. Lấy user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('Không tìm thấy người dùng');
    }

    // 2. Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash
    );

    if (!isCurrentPasswordValid) {
      throw new AppError('Mật khẩu hiện tại không đúng', 400);
    }

    // 3. Hash mật khẩu mới
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    // 4. Update
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // 5. Revoke tất cả sessions (bắt đăng nhập lại)
    await prisma.session.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  },
};
