/**
 * =============================================================================
 * CART.SCHEMA.TS - Validation Schemas cho Cart Module
 * =============================================================================
 *
 * Schemas sử dụng Zod để validate request data
 *
 * ENDPOINTS:
 * - POST   /api/cart/items      - addToCartSchema
 * - PUT    /api/cart/items/:id  - updateCartItemSchema
 * - DELETE /api/cart/items/:id  - (chỉ cần itemId param)
 * - DELETE /api/cart            - (không cần body)
 */
import { z } from 'zod';
// ============================================================================
// ADD TO CART SCHEMA
// ============================================================================
/**
 * Schema cho POST /api/cart/items
 *
 * Thêm sản phẩm vào giỏ hàng
 * - Nếu sản phẩm đã có trong cart → tăng quantity
 * - Nếu chưa có → tạo mới cart item
 */
export const addToCartSchema = z.object({
    productId: z.string({ message: 'productId là bắt buộc' }),
    quantity: z
        .number()
        .int('Số lượng phải là số nguyên')
        .positive('Số lượng phải lớn hơn 0')
        .default(1),
});
// ============================================================================
// UPDATE CART ITEM SCHEMA
// ============================================================================
/**
 * Schema cho PUT /api/cart/items/:itemId
 *
 * Cập nhật số lượng sản phẩm trong giỏ
 * - quantity = 0 → xóa item khỏi cart
 * - quantity > 0 → cập nhật số lượng
 */
export const updateCartItemSchema = z.object({
    quantity: z
        .number()
        .int('Số lượng phải là số nguyên')
        .min(0, 'Số lượng không được âm'),
});
// ============================================================================
// SYNC CART SCHEMA (Guest → Logged in)
// ============================================================================
/**
 * Schema cho POST /api/cart/sync
 *
 * Sync giỏ hàng từ localStorage (guest) sang database (đã đăng nhập)
 * Gửi danh sách items từ client, server sẽ merge với cart hiện tại
 */
export const syncCartSchema = z.object({
    items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
    })),
});
//# sourceMappingURL=cart.schema.js.map