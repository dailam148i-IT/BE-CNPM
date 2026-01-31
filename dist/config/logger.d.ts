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
export declare const logger: winston.Logger;
export default logger;
//# sourceMappingURL=logger.d.ts.map