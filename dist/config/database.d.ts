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
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
//# sourceMappingURL=database.d.ts.map