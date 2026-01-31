/**
 * =============================================================================
 * USER.CONTROLLER.TS - Request handlers cho quản lý Users (Admin)
 * =============================================================================
 */
import { Request, Response } from 'express';
export declare const userController: {
    /**
     * GET /api/admin/users
     */
    getAll(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/users/:id
     */
    getById(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/admin/users/:id/status
     */
    updateStatus(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/admin/users/:id/role
     */
    updateRole(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/roles
     */
    getRoles(_req: Request, res: Response): Promise<void>;
};
//# sourceMappingURL=user.controller.d.ts.map