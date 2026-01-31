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
import prisma from '../../config/database.js';
import { NotFoundError, BadRequestError } from '../../middleware/errorHandler.js';
export const cartService = {
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
    async getOrCreateCart(userId) {
        let cart;
        if (userId) {
            // Find existing cart for this user
            cart = await prisma.cart.findUnique({
                where: { userId },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    images: {
                                        where: { isThumbnail: true },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            });
            // Create new cart if not exists
            if (!cart) {
                cart = await prisma.cart.create({
                    data: { userId },
                    include: {
                        items: {
                            include: {
                                product: {
                                    include: {
                                        images: {
                                            where: { isThumbnail: true },
                                            take: 1,
                                        },
                                    },
                                },
                            },
                        },
                    },
                });
            }
        }
        else {
            // Guest cart - create new cart without userId
            cart = await prisma.cart.create({
                data: {},
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    images: {
                                        where: { isThumbnail: true },
                                        take: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            });
        }
        return this.formatCartResponse(cart);
    },
    /**
     * getCart - Lấy cart hiện tại của user
     */
    async getCart(userId) {
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: {
                                    where: { isThumbnail: true },
                                    take: 1,
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!cart) {
            return null;
        }
        return this.formatCartResponse(cart);
    },
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
    async addItem(userId, data) {
        const { productId, quantity } = data;
        // 1. Validate product
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new NotFoundError('Sản phẩm không tồn tại');
        }
        if (product.status !== 'PUBLISHED') {
            throw new BadRequestError('Sản phẩm không khả dụng');
        }
        if (product.stockQuantity < quantity) {
            throw new BadRequestError(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho`);
        }
        // 2. Get or create cart
        let cart = await prisma.cart.findUnique({
            where: { userId },
        });
        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
            });
        }
        // 3. Check if product already in cart
        const existingItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: {
                    cartId: cart.id,
                    productId,
                },
            },
        });
        if (existingItem) {
            // Update quantity
            const newQuantity = existingItem.quantity + quantity;
            if (product.stockQuantity < newQuantity) {
                throw new BadRequestError(`Chỉ còn ${product.stockQuantity} sản phẩm trong kho`);
            }
            await prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQuantity },
            });
        }
        else {
            // Create new cart item
            await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId,
                    quantity,
                },
            });
        }
        // 4. Return updated cart
        return this.getOrCreateCart(userId);
    },
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
    async updateItem(userId, itemId, data) {
        const { quantity } = data;
        // 1. Get cart item and verify ownership
        const cartItem = await prisma.cartItem.findFirst({
            where: {
                id: itemId,
                cart: { userId },
            },
            include: {
                product: true,
            },
        });
        if (!cartItem) {
            throw new NotFoundError('Không tìm thấy sản phẩm trong giỏ hàng');
        }
        // 2. Handle quantity = 0 (remove)
        if (quantity === 0) {
            await prisma.cartItem.delete({
                where: { id: itemId },
            });
            return this.getOrCreateCart(userId);
        }
        // 3. Check stock
        if (cartItem.product.stockQuantity < quantity) {
            throw new BadRequestError(`Chỉ còn ${cartItem.product.stockQuantity} sản phẩm trong kho`);
        }
        // 4. Update quantity
        await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
        });
        return this.getOrCreateCart(userId);
    },
    /**
     * removeItem - Xóa item khỏi cart
     */
    async removeItem(userId, itemId) {
        // Verify ownership and delete
        const cartItem = await prisma.cartItem.findFirst({
            where: {
                id: itemId,
                cart: { userId },
            },
        });
        if (!cartItem) {
            throw new NotFoundError('Không tìm thấy sản phẩm trong giỏ hàng');
        }
        await prisma.cartItem.delete({
            where: { id: itemId },
        });
        return this.getOrCreateCart(userId);
    },
    /**
     * clearCart - Xóa toàn bộ cart
     */
    async clearCart(userId) {
        const cart = await prisma.cart.findUnique({
            where: { userId },
        });
        if (cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
        }
        return this.getOrCreateCart(userId);
    },
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
    async syncCart(userId, data) {
        const { items } = data;
        // Get or create user's cart
        let cart = await prisma.cart.findUnique({
            where: { userId },
        });
        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
            });
        }
        // Process each item
        for (const item of items) {
            // Validate product
            const product = await prisma.product.findUnique({
                where: { id: item.productId },
            });
            if (!product || product.status !== 'PUBLISHED') {
                continue; // Skip invalid products
            }
            // Check existing item
            const existingItem = await prisma.cartItem.findUnique({
                where: {
                    cartId_productId: {
                        cartId: cart.id,
                        productId: item.productId,
                    },
                },
            });
            if (existingItem) {
                // Merge quantities
                const newQuantity = Math.min(existingItem.quantity + item.quantity, product.stockQuantity);
                await prisma.cartItem.update({
                    where: { id: existingItem.id },
                    data: { quantity: newQuantity },
                });
            }
            else {
                // Add new item (respect stock limit)
                const quantity = Math.min(item.quantity, product.stockQuantity);
                if (quantity > 0) {
                    await prisma.cartItem.create({
                        data: {
                            cartId: cart.id,
                            productId: item.productId,
                            quantity,
                        },
                    });
                }
            }
        }
        return this.getOrCreateCart(userId);
    },
    /**
     * formatCartResponse - Format cart data cho API response
     *
     * Tính toán:
     * - subtotal cho mỗi item (price * quantity)
     * - totalItems (tổng số lượng)
     * - totalAmount (tổng tiền)
     */
    formatCartResponse(cart) {
        const items = cart.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            quantity: item.quantity,
            product: {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                price: Number(item.product.price),
                stockQuantity: item.product.stockQuantity,
                images: item.product.images,
            },
            subtotal: Number(item.product.price) * item.quantity,
        }));
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
        return {
            id: cart.id,
            userId: cart.userId,
            items,
            totalItems,
            totalAmount,
        };
    },
};
//# sourceMappingURL=cart.service.js.map