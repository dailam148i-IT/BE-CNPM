/**
 * =============================================================================
 * DATABASE.TS - Kết nối Prisma Client với MySQL
 * =============================================================================
 *
 * File này tạo và quản lý kết nối database thông qua Prisma ORM.
 *
 * VẤN ĐỀ: Trong development, mỗi lần hot-reload sẽ tạo PrismaClient mới,
 * dẫn đến nhiều connections → lỗi "Too many connections"
 *
 * GIẢI PHÁP: Singleton Pattern - chỉ tạo 1 instance, lưu vào globalThis
 *
 * CÁCH DÙNG:
 *   import prisma from './config/database';
 *   const users = await prisma.user.findMany();
 */
import { PrismaClient } from '@prisma/client';
/**
 * Tạo một "namespace" trong global để lưu Prisma instance
 *
 * globalThis: đối tượng global trong Node.js (tương tự window trong browser)
 *
 * Lý do dùng "as unknown as": TypeScript workaround để thêm property
 * vào globalThis mà không gặp lỗi type
 */
const globalForPrisma = globalThis;
/**
 * Tạo hoặc lấy lại PrismaClient instance
 *
 * ?? (Nullish Coalescing): Nếu bên trái là null/undefined → dùng bên phải
 *
 * - globalForPrisma.prisma có giá trị → dùng nó (đã tạo trước đó)
 * - globalForPrisma.prisma là undefined → tạo PrismaClient mới
 *
 * Options:
 * - log: Các loại log muốn hiển thị
 *   - 'query': Log tất cả SQL queries (chỉ development)
 *   - 'error': Log lỗi
 *   - 'warn': Log cảnh báo
 */
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        // Nếu đang development → log queries để debug
        // Nếu production → chỉ log errors để tối ưu performance
        log: process.env.NODE_ENV === 'development'
            ? ['query', 'error', 'warn']
            : ['error'],
    });
/**
 * Lưu instance vào global để tái sử dụng
 *
 * Chỉ lưu khi KHÔNG phải production vì:
 * - Development: hot-reload liên tục, cần giữ lại instance
 * - Production: server chỉ start 1 lần, không cần
 */
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
// Export default để import dễ hơn: import prisma from '...'
export default prisma;
//# sourceMappingURL=database.js.map