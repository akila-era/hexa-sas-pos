import { Request, Response, NextFunction } from 'express';
import categoryService from '../services/category.service';
import { AuthRequest } from '../types';

export class CategoryController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const category = await categoryService.create(tenantId, req.body);
      
      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const filters = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string | undefined,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        search: req.query.search as string | undefined,
        parentId: req.query.parentId as string | undefined,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      };

      const result = await categoryService.findAll(tenantId, filters);
      
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const category = await categoryService.findOne(tenantId, req.params.id);
      
      res.json({
        success: true,
        data: category,
      });
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

      const category = await categoryService.update(tenantId, req.params.id, req.body);
      
      res.json({
        success: true,
        data: category,
        message: 'Category updated successfully',
      });
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

      const result = await categoryService.delete(tenantId, req.params.id);
      
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTree(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const tree = await categoryService.getTree(tenantId);
      
      res.json({
        success: true,
        data: tree,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();

