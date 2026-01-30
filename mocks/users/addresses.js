/**
 * Mock Data: User Addresses
 * - GET /api/users/addresses
 * - POST /api/users/addresses
 * - PUT /api/users/addresses/:id
 * - DELETE /api/users/addresses/:id
 */

// ============ GET ADDRESSES ============

export const getAddressesSuccess = {
  endpoint: "GET /api/users/addresses",
  description: "Lấy danh sách địa chỉ thành công",
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: true,
    data: [
      {
        id: "addr-1",
        userId: "uuid-user",
        recipientName: "Nguyễn Văn A",
        phone: "0901234567",
        address: "123 Đường ABC, Phường 1, Quận 1, TP. Hồ Chí Minh",
        isDefault: true,
        createdAt: "2026-01-15T00:00:00.000Z"
      },
      {
        id: "addr-2",
        userId: "uuid-user",
        recipientName: "Nguyễn Văn A (Cơ quan)",
        phone: "0907654321",
        address: "456 Đường XYZ, Phường 5, Quận 3, TP. Hồ Chí Minh",
        isDefault: false,
        createdAt: "2026-01-20T00:00:00.000Z"
      }
    ]
  },
  statusCode: 200
};

export const getAddressesEmpty = {
  endpoint: "GET /api/users/addresses",
  description: "User chưa có địa chỉ",
  headers: { Authorization: "Bearer new-user-token" },
  response: {
    success: true,
    data: []
  },
  statusCode: 200
};

// ============ ADD ADDRESS ============

export const addAddressSuccess = {
  endpoint: "POST /api/users/addresses",
  description: "Thêm địa chỉ mới thành công",
  headers: { Authorization: "Bearer user-token" },
  request: {
    recipientName: "Nguyễn Văn B",
    phone: "0909999888",
    address: "789 Đường DEF, Phường 10, Quận Bình Thạnh, TP.HCM",
    isDefault: false
  },
  response: {
    success: true,
    data: {
      id: "new-addr-uuid",
      userId: "uuid-user",
      recipientName: "Nguyễn Văn B",
      phone: "0909999888",
      address: "789 Đường DEF, Phường 10, Quận Bình Thạnh, TP.HCM",
      isDefault: false,
      createdAt: "2026-01-30T00:00:00.000Z"
    }
  },
  statusCode: 201
};

export const addAddressAsDefault = {
  endpoint: "POST /api/users/addresses",
  description: "Thêm địa chỉ mới làm mặc định",
  headers: { Authorization: "Bearer user-token" },
  request: {
    recipientName: "Tên mới",
    phone: "0901111222",
    address: "Địa chỉ mới",
    isDefault: true // Sẽ bỏ isDefault của địa chỉ cũ
  },
  response: {
    success: true,
    data: {
      id: "new-addr-uuid",
      recipientName: "Tên mới",
      phone: "0901111222",
      address: "Địa chỉ mới",
      isDefault: true
    }
  },
  statusCode: 201
};

export const addAddressMissingFields = {
  endpoint: "POST /api/users/addresses",
  description: "Thiếu trường bắt buộc (address)",
  headers: { Authorization: "Bearer user-token" },
  request: {
    recipientName: "Test"
    // Missing address
  },
  response: {
    success: false,
    message: "Dữ liệu không hợp lệ",
    errors: [
      { field: "address", message: "Địa chỉ là bắt buộc" }
    ]
  },
  statusCode: 400
};

// ============ UPDATE ADDRESS ============

export const updateAddressSuccess = {
  endpoint: "PUT /api/users/addresses/:id",
  description: "Cập nhật địa chỉ thành công",
  params: { id: "addr-1" },
  headers: { Authorization: "Bearer user-token" },
  request: {
    recipientName: "Tên cập nhật",
    phone: "0909876543",
    address: "Địa chỉ cập nhật",
    isDefault: true
  },
  response: {
    success: true,
    data: {
      id: "addr-1",
      recipientName: "Tên cập nhật",
      phone: "0909876543",
      address: "Địa chỉ cập nhật",
      isDefault: true
    }
  },
  statusCode: 200
};

export const updateAddressNotFound = {
  endpoint: "PUT /api/users/addresses/:id",
  description: "Địa chỉ không tồn tại hoặc không thuộc user",
  params: { id: "non-existent-addr" },
  headers: { Authorization: "Bearer user-token" },
  request: { address: "New address" },
  response: {
    success: false,
    message: "Không tìm thấy địa chỉ"
  },
  statusCode: 404
};

export const updateOtherUserAddress = {
  endpoint: "PUT /api/users/addresses/:id",
  description: "Cố gắng cập nhật địa chỉ của user khác",
  params: { id: "other-user-addr" },
  headers: { Authorization: "Bearer user-token" },
  request: { address: "Trying to hack" },
  response: {
    success: false,
    message: "Không tìm thấy địa chỉ"
  },
  statusCode: 404
};

// ============ DELETE ADDRESS ============

export const deleteAddressSuccess = {
  endpoint: "DELETE /api/users/addresses/:id",
  description: "Xóa địa chỉ thành công",
  params: { id: "addr-2" },
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: true,
    message: "Xóa địa chỉ thành công"
  },
  statusCode: 200
};

export const deleteAddressNotFound = {
  endpoint: "DELETE /api/users/addresses/:id",
  description: "Địa chỉ không tồn tại",
  params: { id: "non-existent" },
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: false,
    message: "Không tìm thấy địa chỉ"
  },
  statusCode: 404
};
