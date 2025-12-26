import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../../types';
import { packageService } from '../../services/superadmin';
import { errorHandler } from '../../middlewares/error.middleware';
import { packageCreateSchema, packageUpdateSchema } from '../../utils/superadmin.validation';

export class PackageController {
  /**
   * Create a new package
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const validated = packageCreateSchema.parse(req.body);
      const pkg = await packageService.create(validated);

      const response: ApiResponse = {
        success: true,
        data: pkg,
      };

      res.status(201).json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get all packages
   */
  async findAll(req: AuthRequest, res: Response) {
    try {
      const result = await packageService.findAll(req.query as any);

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
   * Get a single package
   */
  async findOne(req: AuthRequest, res: Response) {
    try {
      const pkg = await packageService.findOne(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: pkg,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Update a package
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const validated = packageUpdateSchema.parse(req.body);
      const pkg = await packageService.update(req.params.id, validated);

      const response: ApiResponse = {
        success: true,
        data: pkg,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Delete a package
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const result = await packageService.delete(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get package statistics
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await packageService.getStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new PackageController();









