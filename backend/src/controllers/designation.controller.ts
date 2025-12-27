import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import designationService from '../services/designation.service';

export class DesignationController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { departmentId, isActive, search, page, limit } = req.query;

      const result = await designationService.findAll({
        tenantId,
        departmentId: departmentId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      const response: ApiResponse = {
        success: true,
        data: result.designations,
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

      const designation = await designationService.findById(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: designation,
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

      const designation = await designationService.create({
        tenantId,
        ...req.body,
      });

      const response: ApiResponse = {
        success: true,
        data: designation,
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

      const designation = await designationService.update(req.params.id, tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        data: designation,
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

      await designationService.delete(req.params.id, tenantId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new DesignationController();

