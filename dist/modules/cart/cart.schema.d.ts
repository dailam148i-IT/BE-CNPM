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
/**
 * Schema cho POST /api/cart/items
 *
 * Thêm sản phẩm vào giỏ hàng
 * - Nếu sản phẩm đã có trong cart → tăng quantity
 * - Nếu chưa có → tạo mới cart item
 */
export declare const addToCartSchema: z.ZodObject<{
    productId: z.ZodString;
    quantity: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    quantity: number;
}, {
    productId: string;
    quantity?: number | undefined;
}>;
/**
 * Schema cho PUT /api/cart/items/:itemId
 *
 * Cập nhật số lượng sản phẩm trong giỏ
 * - quantity = 0 → xóa item khỏi cart
 * - quantity > 0 → cập nhật số lượng
 */
export declare const updateCartItemSchema: z.ZodObject<{
    quantity: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    quantity: number;
}, {
    quantity: number;
}>;
/**
 * Schema cho POST /api/cart/sync
 *
 * Sync giỏ hàng từ localStorage (guest) sang database (đã đăng nhập)
 * Gửi danh sách items từ client, server sẽ merge với cart hiện tại
 */
export declare const syncCartSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        productId: z.ZodString;
        quantity: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        productId: string;
        quantity: number;
    }, {
        productId: string;
        quantity: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        productId: string;
        quantity: number;
    }[];
}, {
    items: {
        productId: string;
        quantity: number;
    }[];
}>;
export type AddToCartDto = z.infer<typeof addToCartSchema>;
export type UpdateCartItemDto = z.infer<typeof updateCartItemSchema>;
export type SyncCartDto = z.infer<typeof syncCartSchema>;
//# sourceMappingURL=cart.schema.d.ts.map