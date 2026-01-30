/**
 * Mock Data: POST /api/auth/login
 */

// ============ SUCCESS CASES ============

export const loginSuccess = {
  description: "Đăng nhập thành công với email",
  request: {
    email: "admin@teashop.com",
    password: "123456"
  },
  response: {
    success: true,
    message: "Đăng nhập thành công",
    data: {
      accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      user: {
        id: "uuid-admin",
        email: "admin@teashop.com",
        fullName: "Admin System",
        phone: null,
        role: "ADMIN"
      }
    }
  },
  statusCode: 200,
  cookies: {
    refreshToken: {
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      httpOnly: true,
      secure: false, // true in production
      sameSite: "strict",
      maxAge: 604800000 // 7 days
    }
  }
};

export const loginWithPhone = {
  description: "Đăng nhập thành công với số điện thoại",
  request: {
    email: "0901234567", // Using phone in email field
    password: "123456"
  },
  response: {
    success: true,
    message: "Đăng nhập thành công",
    data: {
      accessToken: "jwt-token-here",
      user: {
        id: "uuid-customer",
        email: "customer@example.com",
        fullName: "Customer Name",
        phone: "0901234567",
        role: "CUSTOMER"
      }
    }
  },
  statusCode: 200
};

// ============ ERROR CASES ============

export const loginWrongPassword = {
  description: "Mật khẩu sai",
  request: {
    email: "admin@teashop.com",
    password: "wrongpassword"
  },
  response: {
    success: false,
    message: "Email/SĐT hoặc mật khẩu không đúng"
  },
  statusCode: 401
};

export const loginUserNotFound = {
  description: "Email không tồn tại",
  request: {
    email: "notexist@example.com",
    password: "123456"
  },
  response: {
    success: false,
    message: "Email/SĐT hoặc mật khẩu không đúng"
  },
  statusCode: 401
};

export const loginAccountLocked = {
  description: "Tài khoản bị khóa",
  request: {
    email: "locked@example.com",
    password: "123456"
  },
  response: {
    success: false,
    message: "Tài khoản đã bị khóa"
  },
  statusCode: 401
};

export const loginMissingCredentials = {
  description: "Thiếu thông tin đăng nhập",
  request: {
    email: "admin@teashop.com"
    // Missing password
  },
  response: {
    success: false,
    message: "Dữ liệu không hợp lệ",
    errors: [
      { field: "password", message: "Mật khẩu là bắt buộc" }
    ]
  },
  statusCode: 400
};

export const loginRateLimited = {
  description: "Quá nhiều lần thử đăng nhập",
  request: {
    email: "admin@teashop.com",
    password: "wrong"
  },
  response: {
    success: false,
    message: "Quá nhiều lần thử, vui lòng đợi 15 phút"
  },
  statusCode: 429
};
