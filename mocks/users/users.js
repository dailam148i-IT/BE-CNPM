/**
 * Mock Data: Users Module
 * - GET /api/users (Admin)
 * - GET /api/users/:id (Admin)
 * - PUT /api/users/profile
 * - PUT /api/users/change-password
 * - DELETE /api/users/:id (Admin)
 */

// ============ GET ALL USERS (Admin) ============

export const getUsersSuccess = {
  endpoint: "GET /api/users",
  description: "Lấy danh sách users thành công",
  query: { page: 1, limit: 20 },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: {
      users: [
        {
          id: "uuid-1",
          email: "customer1@example.com",
          username: "customer1@example.com",
          fullName: "Khách hàng 1",
          phone: "0901234567",
          status: "ACTIVE",
          createdAt: "2026-01-15T00:00:00.000Z",
          role: { name: "CUSTOMER" },
          _count: { orders: 5 },
          totalSpent: 2500000
        },
        {
          id: "uuid-2",
          email: "customer2@example.com",
          username: "customer2@example.com",
          fullName: "Khách hàng 2",
          phone: "0907654321",
          status: "ACTIVE",
          createdAt: "2026-01-10T00:00:00.000Z",
          role: { name: "CUSTOMER" },
          _count: { orders: 2 },
          totalSpent: 500000
        }
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3
      }
    }
  },
  statusCode: 200
};

export const getUsersWithFilter = {
  endpoint: "GET /api/users",
  description: "Lấy users với filter",
  query: { status: "ACTIVE", search: "khách" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: {
      users: [/* filtered results */],
      pagination: { page: 1, limit: 20, total: 5, totalPages: 1 }
    }
  },
  statusCode: 200
};

export const getUsersForbidden = {
  endpoint: "GET /api/users",
  description: "Non-admin cố gắng truy cập",
  headers: { Authorization: "Bearer customer-token" },
  response: {
    success: false,
    message: "Không có quyền truy cập"
  },
  statusCode: 403
};

// ============ GET USER BY ID (Admin) ============

export const getUserByIdSuccess = {
  endpoint: "GET /api/users/:id",
  description: "Lấy chi tiết user thành công",
  params: { id: "uuid-customer" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    data: {
      id: "uuid-customer",
      email: "customer@example.com",
      username: "customer@example.com",
      fullName: "Nguyễn Văn A",
      phone: "0901234567",
      dateOfBirth: "1990-05-15",
      status: "ACTIVE",
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-01-20T00:00:00.000Z",
      role: { name: "CUSTOMER", description: "Khách hàng" },
      addresses: [
        {
          id: "addr-1",
          recipientName: "Nguyễn Văn A",
          phone: "0901234567",
          address: "123 Đường ABC, Q.1, TP.HCM",
          isDefault: true
        }
      ],
      _count: { orders: 5, reviews: 3 },
      stats: {
        totalOrders: 5,
        totalSpent: 2500000,
        lastLogin: "2026-01-28T10:30:00.000Z"
      }
    }
  },
  statusCode: 200
};

export const getUserByIdNotFound = {
  endpoint: "GET /api/users/:id",
  description: "User không tồn tại",
  params: { id: "non-existent-uuid" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: false,
    message: "Không tìm thấy người dùng"
  },
  statusCode: 404
};

// ============ UPDATE PROFILE ============

export const updateProfileSuccess = {
  endpoint: "PUT /api/users/profile",
  description: "Cập nhật profile thành công",
  headers: { Authorization: "Bearer user-token" },
  request: {
    fullName: "Nguyễn Văn B",
    phone: "0909876543",
    dateOfBirth: "1992-03-20"
  },
  response: {
    success: true,
    data: {
      id: "uuid-user",
      email: "user@example.com",
      fullName: "Nguyễn Văn B",
      phone: "0909876543",
      dateOfBirth: "1992-03-20",
      status: "ACTIVE",
      updatedAt: "2026-01-30T00:00:00.000Z"
    }
  },
  statusCode: 200
};

// ============ CHANGE PASSWORD ============

export const changePasswordSuccess = {
  endpoint: "PUT /api/users/change-password",
  description: "Đổi mật khẩu thành công",
  headers: { Authorization: "Bearer user-token" },
  request: {
    oldPassword: "123456",
    newPassword: "NewPass789"
  },
  response: {
    success: true,
    message: "Đổi mật khẩu thành công"
  },
  statusCode: 200
};

export const changePasswordWrongOld = {
  endpoint: "PUT /api/users/change-password",
  description: "Mật khẩu cũ sai",
  headers: { Authorization: "Bearer user-token" },
  request: {
    oldPassword: "wrongpassword",
    newPassword: "NewPass789"
  },
  response: {
    success: false,
    message: "Mật khẩu cũ không đúng"
  },
  statusCode: 400
};

// ============ DELETE USER (Admin) ============

export const deleteUserSuccess = {
  endpoint: "DELETE /api/users/:id",
  description: "Xóa user thành công (soft delete)",
  params: { id: "uuid-customer" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: true,
    message: "Xóa người dùng thành công"
  },
  statusCode: 200
};

export const deleteUserAdmin = {
  endpoint: "DELETE /api/users/:id",
  description: "Không thể xóa admin",
  params: { id: "uuid-admin" },
  headers: { Authorization: "Bearer admin-token" },
  response: {
    success: false,
    message: "Không thể xóa tài khoản Admin"
  },
  statusCode: 400
};
