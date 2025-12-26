import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../../types';
import { superAdminUsersService } from '../../services/superadmin';
import { errorHandler } from '../../middlewares/error.middleware';
import {
  superAdminUserCreateSchema,
  superAdminUserUpdateSchema,
  superAdminUserFilterSchema,
} from '../../utils/superadmin.validation';

export class SuperAdminUsersController {
  /**
   * Create a new super admin user
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const validated = superAdminUserCreateSchema.parse(req.body);
      const user = await superAdminUsersService.create(validated);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'Super admin user created successfully',
      };

      res.status(201).json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get all super admin users
   */
  async findAll(req: AuthRequest, res: Response) {
    try {
      const filters = superAdminUserFilterSchema.parse(req.query);
      const result = await superAdminUsersService.findAll(filters);

      const response: ApiResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get a single super admin user
   */
  async findOne(req: AuthRequest, res: Response) {
    try {
      const user = await superAdminUsersService.findOne(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: user,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Update a super admin user
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const validated = superAdminUserUpdateSchema.parse(req.body);
      const user = await superAdminUsersService.update(req.params.id, validated);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: 'Super admin user updated successfully',
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Delete (deactivate) a super admin user
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const result = await superAdminUsersService.delete(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Super admin user deactivated successfully',
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Toggle user status
   */
  async toggleStatus(req: AuthRequest, res: Response) {
    try {
      const user = await superAdminUsersService.toggleStatus(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: user,
        message: `Super admin user ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new SuperAdminUsersController();





