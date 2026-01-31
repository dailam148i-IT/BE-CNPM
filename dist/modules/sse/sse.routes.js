import { Router } from 'express';
import { sseController } from './sse.controller.js';
const router = Router();
/**
 * SSE ROUTES
 *
 * GET /api/sse/subscribe?token=xxx - Subscribe to real-time notifications
 *
 * Token is passed via query param since EventSource doesn't support headers
 */
router.get('/subscribe', sseController.subscribe);
export default router;
//# sourceMappingURL=sse.routes.js.map