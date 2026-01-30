/**
 * Mock Data: Auth Token APIs
 * - POST /api/auth/refresh
 * - POST /api/auth/logout
 * - GET /api/auth/profile
 */

// ============ REFRESH TOKEN ============

export const refreshSuccess = {
  endpoint: "POST /api/auth/refresh",
  description: "Làm mới access token thành công",
  cookies: {
    refreshToken: "valid-refresh-token"
  },
  response: {
    success: true,
    data: {
      accessToken: "new-access-token"
    }
  },
  statusCode: 200
};

export const refreshNoToken = {
  endpoint: "POST /api/auth/refresh",
  description: "Không có refresh token trong cookie",
  cookies: {},
  response: {
    success: false,
    message: "Không tìm thấy refresh token"
  },
  statusCode: 401
};

export const refreshInvalidToken = {
  endpoint: "POST /api/auth/refresh",
  description: "Refresh token không hợp lệ",
  cookies: {
    refreshToken: "invalid-or-tampered-token"
  },
  response: {
    success: false,
    message: "Refresh token không hợp lệ"
  },
  statusCode: 401
};

export const refreshExpiredToken = {
  endpoint: "POST /api/auth/refresh",
  description: "Refresh token đã hết hạn",
  cookies: {
    refreshToken: "expired-refresh-token"
  },
  response: {
    success: false,
    message: "Session không hợp lệ hoặc đã hết hạn"
  },
  statusCode: 401
};

export const refreshRevokedSession = {
  endpoint: "POST /api/auth/refresh",
  description: "Session đã bị revoke (logout trước đó)",
  cookies: {
    refreshToken: "revoked-session-token"
  },
  response: {
    success: false,
    message: "Session không hợp lệ hoặc đã hết hạn"
  },
  statusCode: 401
};

// ============ LOGOUT ============

export const logoutSuccess = {
  endpoint: "POST /api/auth/logout",
  description: "Đăng xuất thành công",
  cookies: {
    refreshToken: "valid-refresh-token"
  },
  response: {
    success: true,
    message: "Đăng xuất thành công"
  },
  statusCode: 200,
  clearCookies: ["refreshToken"]
};

export const logoutWithoutToken = {
  endpoint: "POST /api/auth/logout",
  description: "Đăng xuất không có token (vẫn thành công)",
  cookies: {},
  response: {
    success: true,
    message: "Đăng xuất thành công"
  },
  statusCode: 200
};

// ============ GET PROFILE ============

export const profileSuccess = {
  endpoint: "GET /api/auth/profile",
  description: "Lấy thông tin profile thành công",
  headers: {
    Authorization: "Bearer valid-access-token"
  },
  response: {
    success: true,
    data: {
      id: "uuid-user",
      email: "user@example.com",
      username: "user@example.com",
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      dateOfBirth: null,
      status: "ACTIVE",
      createdAt: "2026-01-15T00:00:00.000Z",
      role: { name: "CUSTOMER" },
      addresses: [
        {
          id: "addr-1",
          recipientName: "Nguyễn Văn A",
          phone: "0901234567",
          address: "123 Đường ABC, Q.1, TP.HCM",
          isDefault: true
        }
      ],
      _count: {
        orders: 5,
        reviews: 2
      }
    }
  },
  statusCode: 200
};

export const profileNoToken = {
  endpoint: "GET /api/auth/profile",
  description: "Không có access token",
  headers: {},
  response: {
    success: false,
    message: "Vui lòng đăng nhập"
  },
  statusCode: 401
};

export const profileExpiredToken = {
  endpoint: "GET /api/auth/profile",
  description: "Access token đã hết hạn",
  headers: {
    Authorization: "Bearer expired-token"
  },
  response: {
    success: false,
    message: "Token đã hết hạn",
    code: "TOKEN_EXPIRED"
  },
  statusCode: 401
};

export const profileInvalidToken = {
  endpoint: "GET /api/auth/profile",
  description: "Access token không hợp lệ",
  headers: {
    Authorization: "Bearer invalid-token"
  },
  response: {
    success: false,
    message: "Token không hợp lệ"
  },
  statusCode: 401
};
