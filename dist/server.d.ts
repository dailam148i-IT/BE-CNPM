/**
 * =============================================================================
 * SERVER.TS - Entry Point của ứng dụng Backend
 * =============================================================================
 *
 * Đây là "Bộ não" trung tâm của Backend.
 * Nó chịu trách nhiệm khởi tạo server, kết nối Database, và điều phối Request.
 *
 * 🏗️ KIẾN TRÚC SERVER (REQUEST FLOW):
 *
 *    [CLIENT] (React/Mobile)
 *       ⬇️
 *    [SERVER.TS] (Express App)
 *       ⬇️
 *    1. Middleware Global (Chạy cho TẤT CẢ request)
 *       |-- CORS (Cho phép ai gọi?)
 *       |-- Body Parser (Đọc JSON/Form)
 *       |-- Logger (Ghi log)
 *       ⬇️
 *    2. Rate Limiting (Chống spam/DDoS)
 *       ⬇️
 *    3. Routes (Bộ định tuyến)
 *       |-- /api/auth   ----> auth.routes.ts   ----> auth.controller.ts
 *       |-- /api/admin  ----> admin.routes.ts  ----> admin.controller.ts
 *       |-- ...
 *       ⬇️
 *    4. Controllers (Xử lý logic)
 *       ⬇️
 *    5. Services (Business Logic & Database)
 *       |-- Prisma Client ----> [DATABASE] (MySQL)
 *
 * =============================================================================
 */
export {};
//# sourceMappingURL=server.d.ts.map