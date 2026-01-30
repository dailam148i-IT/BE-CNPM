/**
 * Mock Data: POST /api/auth/register
 */

// ============ SUCCESS CASES ============

export const registerSuccess = {
  description: "Đăng ký thành công với đầy đủ thông tin",
  request: {
    email: "newuser@example.com",
    password: "Abc123456",
    fullName: "Nguyễn Văn A",
    phone: "0901234567"
  },
  response: {
    success: true,
    message: "Đăng ký thành công",
    data: {
      id: "uuid-string",
      email: "newuser@example.com",
      fullName: "Nguyễn Văn A",
      status: "ACTIVE",
      createdAt: "2026-01-30T00:00:00.000Z"
    }
  },
  statusCode: 201
};

export const registerMinimal = {
  description: "Đăng ký chỉ với email và password",
  request: {
    email: "minimal@example.com",
    password: "123456",
    fullName: "User"
  },
  response: {
    success: true,
    message: "Đăng ký thành công",
    data: {
      id: "uuid-string",
      email: "minimal@example.com",
      fullName: "User",
      status: "ACTIVE"
    }
  },
  statusCode: 201
};

// ============ ERROR CASES ============

export const registerDuplicateEmail = {
  description: "Email đã tồn tại",
  request: {
    email: "admin@teashop.com", // Email đã có trong DB
    password: "123456",
    fullName: "Test User"
  },
  response: {
    success: false,
    message: "Email đã được sử dụng"
  },
  statusCode: 400
};

export const registerDuplicatePhone = {
  description: "Số điện thoại đã tồn tại",
  request: {
    email: "newphone@example.com",
    password: "123456",
    fullName: "Test User",
    phone: "0901234567" // Phone đã có
  },
  response: {
    success: false,
    message: "Số điện thoại đã được sử dụng"
  },
  statusCode: 400
};

export const registerInvalidEmail = {
  description: "Email không hợp lệ",
  request: {
    email: "invalid-email",
    password: "123456",
    fullName: "Test"
  },
  response: {
    success: false,
    message: "Dữ liệu không hợp lệ",
    errors: [
      { field: "email", message: "Email không hợp lệ" }
    ]
  },
  statusCode: 400
};

export const registerWeakPassword = {
  description: "Mật khẩu quá ngắn",
  request: {
    email: "weak@example.com",
    password: "123", // < 6 chars
    fullName: "Test"
  },
  response: {
    success: false,
    message: "Dữ liệu không hợp lệ",
    errors: [
      { field: "password", message: "Mật khẩu phải có ít nhất 6 ký tự" }
    ]
  },
  statusCode: 400
};

export const registerMissingFields = {
  description: "Thiếu trường bắt buộc",
  request: {
    email: "missing@example.com"
    // Missing password and fullName
  },
  response: {
    success: false,
    message: "Dữ liệu không hợp lệ",
    errors: [
      { field: "password", message: "Mật khẩu là bắt buộc" },
      { field: "fullName", message: "Họ tên là bắt buộc" }
    ]
  },
  statusCode: 400
};

export const registerInvalidPhone = {
  description: "Số điện thoại không hợp lệ",
  request: {
    email: "phone@example.com",
    password: "123456",
    fullName: "Test",
    phone: "abc123" // Invalid
  },
  response: {
    success: false,
    message: "Dữ liệu không hợp lệ",
    errors: [
      { field: "phone", message: "Số điện thoại không hợp lệ" }
    ]
  },
  statusCode: 400
};
