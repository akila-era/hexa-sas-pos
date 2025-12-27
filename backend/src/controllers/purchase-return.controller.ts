import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import purchaseReturnService from '../services/purchase-return.service';

/**
 * Purchase Return Controller
 */
export class PurchaseReturnController {
  /**
   * Get all purchase returns
   * GET /api/v1/purchase-returns
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

      const filters: any = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        supplierId: req.query.supplierId as string,
        status: req.query.status as string,
        search: req.query.search as string,
      };

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const result = await purchaseReturnService.findAll(tenantId, filters);

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single purchase return
   * GET /api/v1/purchase-returns/:id
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

      const pr = await purchaseReturnService.findOne(tenantId, req.params.id);
      res.json({ success: true, data: pr });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create purchase return
   * POST /api/v1/purchase-returns
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

      const pr = await purchaseReturnService.create(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: pr, message: 'Purchase return created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update purchase return
   * PUT /api/v1/purchase-returns/:id
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

      const pr = await purchaseReturnService.update(tenantId, req.params.id, req.body);
      res.json({ success: true, data: pr, message: 'Purchase return updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete purchase return
   * DELETE /api/v1/purchase-returns/:id
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

      const result = await purchaseReturnService.delete(tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new PurchaseReturnController();

