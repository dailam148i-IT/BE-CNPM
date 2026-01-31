import { Request, Response, NextFunction } from 'express';
export declare const sseController: {
    /**
     * GET /api/sse/subscribe?token=xxx
     * Subscribe to real-time notifications via Server-Sent Events
     *
     * Note: EventSource doesn't support custom headers, so we pass token via query
     */
    subscribe(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
};
//# sourceMappingURL=sse.controller.d.ts.map