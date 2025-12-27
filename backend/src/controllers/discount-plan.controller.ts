import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import discountPlanService from '../services/discount-plan.service';

export class DiscountPlanController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const result = await discountPlanService.findAll(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        status: req.query.status as string,
        search: req.query.search as string,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const plan = await discountPlanService.findOne(tenantId, req.params.id);
      res.json({ success: true, data: plan });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const plan = await discountPlanService.create(tenantId, req.body);
      res.status(201).json({ success: true, data: plan, message: 'Discount plan created successfully' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const plan = await discountPlanService.update(tenantId, req.params.id, req.body);
      res.json({ success: true, data: plan, message: 'Discount plan updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const result = await discountPlanService.delete(tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new DiscountPlanController();

