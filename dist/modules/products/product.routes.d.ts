/**
 * =============================================================================
 * PRODUCT.ROUTES.TS - Định nghĩa Routes cho Products
 * =============================================================================
 *
 * File này định nghĩa tất cả API endpoints của Product module
 *
 * ROUTE PATTERN:
 *   router.[method](path, [middlewares...], controller.handler)
 *
 * MIDDLEWARE CHAIN (Admin routes):
 * 1. authenticate → Verify JWT token, gắn user vào req.user
 * 2. authorize('ADMIN') → Check role, reject nếu không phải admin
 * 3. validate(schema) → Validate req.body theo schema
 * 4. controller.handler → Xử lý logic
 *
 * ENDPOINTS OVERVIEW:
 *
 * PUBLIC (không cần login):
 * - GET  /api/products              → List products (PUBLISHED only)
 * - GET  /api/products/detail/:slug → Product detail by slug
 *
 * ADMIN (cần ADMIN role):
 * - GET    /api/products/admin       → List all products (mọi status)
 * - GET    /api/products/admin/:id   → Product detail by ID
 * - POST   /api/products             → Create product
 * - PUT    /api/products/:id         → Update product
 * - DELETE /api/products/:id         → Delete product (soft/hard)
 */
declare const router: import("express-serve-static-core").Router;
export default router;
//# sourceMappingURL=product.routes.d.ts.map