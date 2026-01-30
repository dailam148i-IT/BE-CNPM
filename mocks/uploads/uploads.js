/**
 * Mock Data: Upload Module
 * - POST /api/uploads/image
 * - POST /api/uploads/images
 * - DELETE /api/uploads/image
 */

// ============ UPLOAD SINGLE IMAGE ============

export const uploadSingleSuccess = {
  endpoint: "POST /api/uploads/image",
  description: "Upload 1 ảnh thành công",
  headers: {
    Authorization: "Bearer admin-token",
    "Content-Type": "multipart/form-data"
  },
  formData: {
    image: "file.jpg", // File object
    folder: "products"
  },
  response: {
    success: true,
    data: {
      url: "https://res.cloudinary.com/demo/image/upload/v1234567890/products/abc123.jpg",
      publicId: "products/abc123",
      width: 800,
      height: 600
    }
  },
  statusCode: 200
};

export const uploadNoFile = {
  endpoint: "POST /api/uploads/image",
  description: "Không có file",
  headers: { Authorization: "Bearer admin-token" },
  formData: {},
  response: {
    success: false,
    message: "Vui lòng chọn file để upload"
  },
  statusCode: 400
};

export const uploadInvalidFileType = {
  endpoint: "POST /api/uploads/image",
  description: "File không phải ảnh",
  headers: { Authorization: "Bearer admin-token" },
  formData: { image: "document.pdf" },
  response: {
    success: false,
    message: "Chỉ cho phép upload file ảnh (jpg, png, gif, webp)"
  },
  statusCode: 400
};

export const uploadFileTooLarge = {
  endpoint: "POST /api/uploads/image",
  description: "File quá lớn",
  headers: { Authorization: "Bearer admin-token" },
  formData: { image: "huge_image.jpg" }, // > 5MB
  response: {
    success: false,
    message: "File quá lớn (tối đa 5MB)"
  },
  statusCode: 400
};

// ============ UPLOAD MULTIPLE IMAGES ============

export const uploadMultipleSuccess = {
  endpoint: "POST /api/uploads/images",
  description: "Upload nhiều ảnh thành công",
  headers: { Authorization: "Bearer admin-token" },
  formData: {
    images: ["file1.jpg", "file2.jpg", "file3.jpg"],
    folder: "products"
  },
  response: {
    success: true,
    data: [
      { url: "https://..../img1.jpg", publicId: "products/img1" },
      { url: "https://..../img2.jpg", publicId: "products/img2" },
      { url: "https://..../img3.jpg", publicId: "products/img3" }
    ]
  },
  statusCode: 200
};

export const uploadMultipleEmpty = {
  endpoint: "POST /api/uploads/images",
  description: "Không có file nào",
  headers: { Authorization: "Bearer admin-token" },
  formData: {},
  response: {
    success: false,
    message: "Vui lòng chọn ít nhất 1 file"
  },
  statusCode: 400
};

// ============ DELETE IMAGE ============

export const deleteImageSuccess = {
  endpoint: "DELETE /api/uploads/image",
  description: "Xóa ảnh thành công",
  headers: { Authorization: "Bearer admin-token" },
  request: { publicId: "products/abc123" },
  response: {
    success: true
  },
  statusCode: 200
};

export const deleteImageNoPublicId = {
  endpoint: "DELETE /api/uploads/image",
  description: "Thiếu publicId",
  headers: { Authorization: "Bearer admin-token" },
  request: {},
  response: {
    success: false,
    message: "publicId là bắt buộc"
  },
  statusCode: 400
};

// ============ AUTHORIZATION ============

export const uploadUnauthorized = {
  endpoint: "POST /api/uploads/image",
  description: "Chưa đăng nhập",
  headers: {},
  response: {
    success: false,
    message: "Vui lòng đăng nhập"
  },
  statusCode: 401
};

export const uploadForbidden = {
  endpoint: "POST /api/uploads/image",
  description: "Không phải Admin/Staff",
  headers: { Authorization: "Bearer customer-token" },
  response: {
    success: false,
    message: "Không có quyền truy cập"
  },
  statusCode: 403
};
