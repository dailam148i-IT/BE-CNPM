/**
 * =============================================================================
 * USER.CONTROLLER.TS - Request handlers cho quản lý Users (Admin)
 * =============================================================================
 */
import { userService } from './user.service.js';
import { success } from '../../utils/response.js';
export const userController = {
    /**
     * GET /api/admin/users
     */
    async getAll(req, res) {
        const result = await userService.findAll(req.query);
        success(res, result);
    },
    /**
     * GET /api/admin/users/:id
     */
    async getById(req, res) {
        const { id } = req.params;
        const user = await userService.findById(id);
        success(res, user);
    },
    /**
     * PUT /api/admin/users/:id/status
     */
    async updateStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const user = await userService.updateStatus(id, status);
        success(res, user);
    },
    /**
     * PUT /api/admin/users/:id/role
     */
    async updateRole(req, res) {
        const { id } = req.params;
        const { roleId } = req.body;
        const user = await userService.updateRole(id, roleId);
        success(res, user);
    },
    /**
     * GET /api/admin/roles
     */
    async getRoles(_req, res) {
        const roles = await userService.getRoles();
        success(res, roles);
    },
};
//# sourceMappingURL=user.controller.js.map