import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import salesReturnService from '../services/sales-return.service';

/**
 * Sales Return Controller
 */
export class SalesReturnController {
  /**
   * Get all sales returns
   * GET /api/v1/sales-returns
   */
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const result = await salesReturnService.findAll(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        customerId: req.query.customerId as string,
        status: req.query.status as string,
        search: req.query.search as string,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single sales return
   * GET /api/v1/sales-returns/:id
   */
  async findOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const sr = await salesReturnService.findOne(tenantId, req.params.id);
      res.json({ success: true, data: sr });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create sales return
   * POST /api/v1/sales-returns
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }

      const sr = await salesReturnService.create(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: sr, message: 'Sales return created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update sales return
   * PUT /api/v1/sales-returns/:id
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const sr = await salesReturnService.update(tenantId, req.params.id, req.body);
      res.json({ success: true, data: sr, message: 'Sales return updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete sales return
   * DELETE /api/v1/sales-returns/:id
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const result = await salesReturnService.delete(tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new SalesReturnController();

