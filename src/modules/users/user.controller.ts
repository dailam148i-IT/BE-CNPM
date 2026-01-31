/**
 * =============================================================================
 * USER.CONTROLLER.TS - Request handlers cho quản lý Users (Admin)
 * =============================================================================
 */

import { Request, Response } from 'express';
import { userService } from './user.service.js';
import { success } from '../../utils/response.js';

export const userController = {
  /**
   * GET /api/admin/users
   */
  async getAll(req: Request, res: Response) {
    const result = await userService.findAll(req.query as any);
    success(res, result);
  },

  /**
   * GET /api/admin/users/:id
   */
  async getById(req: Request, res: Response) {
    const { id } = req.params;
    const user = await userService.findById(id);
    success(res, user);
  },

  /**
   * PUT /api/admin/users/:id/status
   */
  async updateStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;
    const user = await userService.updateStatus(id, status);
    success(res, user);
  },

  /**
   * PUT /api/admin/users/:id/role
   */
  async updateRole(req: Request, res: Response) {
    const { id } = req.params;
    const { roleId } = req.body;
    const user = await userService.updateRole(id, roleId);
    success(res, user);
  },

  /**
   * GET /api/admin/roles
   */
  async getRoles(_req: Request, res: Response) {
    const roles = await userService.getRoles();
    success(res, roles);
  },
};
