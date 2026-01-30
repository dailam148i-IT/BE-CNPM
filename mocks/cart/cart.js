/**
 * Mock Data: Cart Module
 * - GET /api/cart
 * - POST /api/cart/items
 * - PUT /api/cart/items/:itemId
 * - DELETE /api/cart/items/:itemId
 * - DELETE /api/cart
 */

// ============ SAMPLE CART ============

export const sampleCart = {
  id: "cart-uuid-1",
  userId: "user-uuid-1",
  createdAt: "2026-01-20T00:00:00.000Z",
  updatedAt: "2026-01-30T10:00:00.000Z",
  items: [
    {
      id: "item-1",
      cartId: "cart-uuid-1",
      productId: "prod-uuid-1",
      quantity: 2,
      addedAt: "2026-01-25T00:00:00.000Z",
      product: {
        id: "prod-uuid-1",
        name: "Trà Ô Long Đài Loan",
        slug: "tra-o-long-dai-loan",
        price: 250000,
        stockQuantity: 100,
        status: "PUBLISHED",
        images: [{ imageUrl: "https://cdn.example.com/tea1.jpg" }]
      }
    },
    {
      id: "item-2",
      cartId: "cart-uuid-1",
      productId: "prod-uuid-2",
      quantity: 1,
      addedAt: "2026-01-28T00:00:00.000Z",
      product: {
        id: "prod-uuid-2",
        name: "Trà Ô Long Thiết Quan Âm",
        slug: "tra-o-long-thiet-quan-am",
        price: 350000,
        stockQuantity: 50,
        status: "PUBLISHED",
        images: [{ imageUrl: "https://cdn.example.com/tea2.jpg" }]
      }
    }
  ],
  itemCount: 2,
  total: 850000 // 2 * 250000 + 1 * 350000
};

// ============ GET CART ============

export const getCartSuccess = {
  endpoint: "GET /api/cart",
  description: "Lấy giỏ hàng thành công",
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: true,
    data: sampleCart
  },
  statusCode: 200
};

export const getCartEmpty = {
  endpoint: "GET /api/cart",
  description: "Giỏ hàng trống",
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: true,
    data: {
      id: "new-cart-uuid",
      userId: "user-uuid",
      items: [],
      itemCount: 0,
      total: 0
    }
  },
  statusCode: 200
};

export const getCartUnauthorized = {
  endpoint: "GET /api/cart",
  description: "Chưa đăng nhập",
  headers: {},
  response: {
    success: false,
    message: "Vui lòng đăng nhập"
  },
  statusCode: 401
};

// ============ ADD ITEM ============

export const addItemSuccess = {
  endpoint: "POST /api/cart/items",
  description: "Thêm sản phẩm vào giỏ thành công",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "prod-uuid-3",
    quantity: 2
  },
  response: {
    success: true,
    data: {
      ...sampleCart,
      items: [
        ...sampleCart.items,
        {
          id: "new-item",
          productId: "prod-uuid-3",
          quantity: 2,
          product: { name: "Trà Xanh", price: 180000 }
        }
      ],
      itemCount: 3,
      total: 1210000
    }
  },
  statusCode: 200
};

export const addItemExisting = {
  endpoint: "POST /api/cart/items",
  description: "Thêm sản phẩm đã có trong giỏ (tăng số lượng)",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "prod-uuid-1", // Already in cart with qty 2
    quantity: 1
  },
  response: {
    success: true,
    data: {
      // item-1 now has quantity: 3
      items: [
        { id: "item-1", productId: "prod-uuid-1", quantity: 3 }
      ]
    }
  },
  statusCode: 200
};

export const addItemNotFound = {
  endpoint: "POST /api/cart/items",
  description: "Sản phẩm không tồn tại",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "non-existent-product",
    quantity: 1
  },
  response: {
    success: false,
    message: "Sản phẩm không tồn tại"
  },
  statusCode: 404
};

export const addItemOutOfStock = {
  endpoint: "POST /api/cart/items",
  description: "Sản phẩm hết hàng",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "prod-uuid-sold-out",
    quantity: 1
  },
  response: {
    success: false,
    message: "Số lượng tồn kho không đủ"
  },
  statusCode: 400
};

export const addItemExceedStock = {
  endpoint: "POST /api/cart/items",
  description: "Số lượng vượt tồn kho",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "prod-uuid-1",
    quantity: 999
  },
  response: {
    success: false,
    message: "Vượt quá số lượng tồn kho"
  },
  statusCode: 400
};

export const addItemUnavailable = {
  endpoint: "POST /api/cart/items",
  description: "Sản phẩm không còn bán",
  headers: { Authorization: "Bearer user-token" },
  request: {
    productId: "prod-uuid-discontinued",
    quantity: 1
  },
  response: {
    success: false,
    message: "Sản phẩm không khả dụng"
  },
  statusCode: 400
};

// ============ UPDATE ITEM ============

export const updateItemSuccess = {
  endpoint: "PUT /api/cart/items/:itemId",
  description: "Cập nhật số lượng thành công",
  params: { itemId: "item-1" },
  headers: { Authorization: "Bearer user-token" },
  request: { quantity: 5 },
  response: {
    success: true,
    data: {
      items: [
        { id: "item-1", quantity: 5 }
      ]
    }
  },
  statusCode: 200
};

export const updateItemNotFound = {
  endpoint: "PUT /api/cart/items/:itemId",
  description: "Item không tồn tại trong giỏ",
  params: { itemId: "non-existent-item" },
  headers: { Authorization: "Bearer user-token" },
  request: { quantity: 1 },
  response: {
    success: false,
    message: "Không tìm thấy sản phẩm trong giỏ"
  },
  statusCode: 404
};

export const updateItemInvalidQuantity = {
  endpoint: "PUT /api/cart/items/:itemId",
  description: "Số lượng không hợp lệ",
  params: { itemId: "item-1" },
  headers: { Authorization: "Bearer user-token" },
  request: { quantity: 0 },
  response: {
    success: false,
    message: "Số lượng phải lớn hơn 0"
  },
  statusCode: 400
};

// ============ REMOVE ITEM ============

export const removeItemSuccess = {
  endpoint: "DELETE /api/cart/items/:itemId",
  description: "Xóa sản phẩm khỏi giỏ thành công",
  params: { itemId: "item-1" },
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: true,
    data: {
      items: [{ id: "item-2" }], // Only item-2 remains
      itemCount: 1,
      total: 350000
    }
  },
  statusCode: 200
};

// ============ CLEAR CART ============

export const clearCartSuccess = {
  endpoint: "DELETE /api/cart",
  description: "Xóa toàn bộ giỏ hàng",
  headers: { Authorization: "Bearer user-token" },
  response: {
    success: true,
    message: "Đã xóa giỏ hàng"
  },
  statusCode: 200
};
