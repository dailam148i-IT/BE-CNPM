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
import { Request, Response, NextFunction, RequestHandler } from 'express';
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
/**
 * Wrap async function để tự động catch lỗi
 */
export declare const asyncHandler: (fn: AsyncRequestHandler) => RequestHandler;
export {};
//# sourceMappingURL=asyncHandler.d.ts.map