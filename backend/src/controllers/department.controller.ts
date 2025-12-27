import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import departmentService from '../services/department.service';
import { transformDepartment } from '../utils/transformers';

export class DepartmentController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { isActive, search, page, limit } = req.query;

      const result = await departmentService.findAll({
        tenantId,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      // Transform data to match frontend format
      const transformedDepartments = result.departments.map(transformDepartment);

      const response: ApiResponse = {
        success: true,
        data: transformedDepartments,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const department = await departmentService.findById(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: department,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const department = await departmentService.create({
        tenantId,
        ...req.body,
      });

      const response: ApiResponse = {
        success: true,
        data: department,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const department = await departmentService.update(req.params.id, tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        data: department,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      await departmentService.delete(req.params.id, tenantId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new DepartmentController();

