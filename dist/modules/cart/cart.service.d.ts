/**
 * =============================================================================
 * CART.SERVICE.TS - Business Logic cho Cart Module
 * =============================================================================
 *
 * Service xử lý toàn bộ logic giỏ hàng:
 * - Tạo/lấy cart cho user hoặc guest
 * - Thêm/sửa/xóa items trong cart
 * - Tính tổng tiền
 * - Sync cart khi user đăng nhập
 *
 * CART FLOW:
 * 1. Guest: Cart lưu trong localStorage (frontend), không có cartId
 * 2. Logged in: Cart lưu trong database với userId
 * 3. Login: Sync items từ localStorage vào database cart
 */
import type { AddToCartDto, UpdateCartItemDto, SyncCartDto } from './cart.schema.js';
/**
 * Interface cho Cart response (cho type safety)
 */
interface CartWithTotal {
    id: string;
    userId: string | null;
    items: Array<{
        id: string;
        productId: string;
        quantity: number;
        product: {
            id: string;
            name: string;
            slug: string;
            price: number;
            stockQuantity: number;
            images: Array<{
                imageUrl: string;
            }>;
        };
        subtotal: number;
    }>;
    totalItems: number;
    totalAmount: number;
}
export declare const cartService: {
    /**
     * getOrCreateCart - Lấy hoặc tạo cart cho user
     *
     * @param userId - User ID (null nếu là guest)
     * @returns Cart object
     *
     * LOGIC:
     * - Nếu có userId: Tìm cart của user, chưa có thì tạo mới
     * - Nếu không có userId: Tạo cart mới (guest cart)
     */
    getOrCreateCart(userId: string | null): Promise<CartWithTotal>;
    /**
     * getCart - Lấy cart hiện tại của user
     */
    getCart(userId: string): Promise<CartWithTotal | null>;
    /**
     * addItem - Thêm sản phẩm vào cart
     *
     * @param userId - User ID
     * @param data - { productId, quantity }
     *
     * LOGIC:
     * 1. Kiểm tra product tồn tại và còn hàng
     * 2. Kiểm tra stock đủ không
     * 3. Nếu product đã có trong cart → tăng quantity
     * 4. Nếu chưa có → tạo mới cart item
     */
    addItem(userId: string, data: AddToCartDto): Promise<CartWithTotal>;
    /**
     * updateItem - Cập nhật số lượng item trong cart
     *
     * @param userId - User ID
     * @param itemId - Cart Item ID
     * @param data - { quantity }
     *
     * LOGIC:
     * - quantity = 0 → xóa item
     * - quantity > 0 → update, kiểm tra stock
     */
    updateItem(userId: string, itemId: string, data: UpdateCartItemDto): Promise<CartWithTotal>;
    /**
     * removeItem - Xóa item khỏi cart
     */
    removeItem(userId: string, itemId: string): Promise<CartWithTotal>;
    /**
     * clearCart - Xóa toàn bộ cart
     */
    clearCart(userId: string): Promise<CartWithTotal>;
    /**
     * syncCart - Sync cart từ localStorage khi user login
     *
     * @param userId - User ID vừa đăng nhập
     * @param items - Items từ localStorage
     *
     * LOGIC:
     * - Merge items từ localStorage với cart hiện tại
     * - Nếu product đã có → cộng quantity
     * - Nếu chưa có → thêm mới
     */
    syncCart(userId: string, data: SyncCartDto): Promise<CartWithTotal>;
    /**
     * formatCartResponse - Format cart data cho API response
     *
     * Tính toán:
     * - subtotal cho mỗi item (price * quantity)
     * - totalItems (tổng số lượng)
     * - totalAmount (tổng tiền)
     */
    formatCartResponse(cart: any): CartWithTotal;
};
export {};
//# sourceMappingURL=cart.service.d.ts.map