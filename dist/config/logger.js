/**
 * =============================================================================
 * LOGGER.TS - Winston Logger Configuration
 * =============================================================================
 *
 * Centralized logging system for the application.
 * Logs to both console and file for production debugging.
 *
 * LEVELS:
 * - error: Critical errors that need immediate attention
 * - warn: Warning messages (potential issues)
 * - info: General information (startup, requests)
 * - debug: Detailed debugging info (dev only)
 */
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Log format for files (JSON for parsing)
const fileFormat = winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json());
// Log format for console (colorized, readable)
const consoleFormat = winston.format.combine(winston.format.colorize({ all: true }), winston.format.timestamp({ format: 'HH:mm:ss' }), winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
}));
// Create logger instance
export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    defaultMeta: { service: 'ecommerce-api' },
    transports: [
        // Console transport (always active)
        new winston.transports.Console({
            format: consoleFormat,
        }),
    ],
});
// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    const logsDir = path.join(__dirname, '../../logs');
    logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: fileFormat,
        maxsize: 5 * 1024 * 1024, // 5MB
        maxFiles: 5,
    }));
    logger.add(new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: fileFormat,
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
    }));
}
export default logger;
//# sourceMappingURL=logger.js.map