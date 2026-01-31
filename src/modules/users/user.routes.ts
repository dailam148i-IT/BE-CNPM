/**
 * =============================================================================
 * USER.ROUTES.TS - API Routes cho quản lý Users (Admin only)
 * =============================================================================
 * 
 * ADMIN ROUTES:
 * - GET    /api/admin/users           - Danh sách users
 * - GET    /api/admin/users/:id       - Chi tiết user
 * - PUT    /api/admin/users/:id/status - Block/Unblock user
 * - PUT    /api/admin/users/:id/role   - Thay đổi role
 * - GET    /api/admin/roles           - Danh sách roles
 */

import { Router } from 'express';
import { userController } from './user.controller.js';
import { authenticate, authorize } from '../../middleware/authenticate.js';
import { asyncHandler } from '../../middleware/errorHandler.js';

const router = Router();

// All routes require admin
router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/users', asyncHandler(userController.getAll));
router.get('/users/:id', asyncHandler(userController.getById));
router.put('/users/:id/status', asyncHandler(userController.updateStatus));
router.put('/users/:id/role', asyncHandler(userController.updateRole));
router.get('/roles', asyncHandler(userController.getRoles));

export default router;
