import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import brandService from '../services/brand.service';
import { transformBrand } from '../utils/transformers';

export class BrandController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { search, isActive, page, limit, sortBy, sortOrder } = req.query;

      const result = await brandService.findAll({
        tenantId,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      // Transform data to match frontend format
      const transformedBrands = result.brands.map(transformBrand);

      const response: ApiResponse = {
        success: true,
        data: transformedBrands,
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

      const brand = await brandService.findById(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: brand,
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

      const brand = await brandService.create({
        tenantId,
        ...req.body,
      });

      const response: ApiResponse = {
        success: true,
        data: brand,
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

      const brand = await brandService.update(req.params.id, tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        data: brand,
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

      await brandService.delete(req.params.id, tenantId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new BrandController();

