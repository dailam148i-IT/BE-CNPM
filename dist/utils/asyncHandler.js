/**
 * =============================================================================
 * ASYNCHANDLER.TS - Wrapper để bắt lỗi async trong Express
 * =============================================================================
 *
 * VẤN ĐỀ:
 * Express không tự động catch lỗi trong async function.
 * Nếu không wrap, lỗi sẽ bị nuốt hoặc crash server.
 *
 * GIẢI PHÁP:
 * Wrap mỗi async handler để tự động catch và forward lỗi sang next()
 *
 * CÁCH DÙNG:
 * router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
/**
 * Wrap async function để tự động catch lỗi
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=asyncHandler.js.map