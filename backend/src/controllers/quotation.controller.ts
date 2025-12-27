import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import quotationService from '../services/quotation.service';

/**
 * Quotation Controller
 */
export class QuotationController {
  /**
   * Get all quotations
   * GET /api/v1/quotations
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

      const result = await quotationService.findAll(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        customerId: req.query.customerId as string,
        status: req.query.status as string,
        productId: req.query.productId as string,
        search: req.query.search as string,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single quotation
   * GET /api/v1/quotations/:id
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

      const quotation = await quotationService.findOne(tenantId, req.params.id);
      res.json({ success: true, data: quotation });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create quotation
   * POST /api/v1/quotations
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

      const quotation = await quotationService.create(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: quotation, message: 'Quotation created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update quotation
   * PUT /api/v1/quotations/:id
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

      const quotation = await quotationService.update(tenantId, req.params.id, req.body);
      res.json({ success: true, data: quotation, message: 'Quotation updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update quotation status
   * PUT /api/v1/quotations/:id/status
   */
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const { status } = req.body;
      const quotation = await quotationService.updateStatus(tenantId, req.params.id, status);
      res.json({ success: true, data: quotation, message: 'Quotation status updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Convert quotation to sale
   * POST /api/v1/quotations/:id/convert
   */
  async convertToSale(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      const userId = req.user?.id;
      const branchId = req.branchId || req.body.branchId;
      
      if (!tenantId || !userId || !branchId) {
        return res.status(403).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication and branch required' },
        });
      }

      const result = await quotationService.convertToSale(tenantId, req.params.id, userId, branchId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete quotation
   * DELETE /api/v1/quotations/:id
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

      const result = await quotationService.delete(tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new QuotationController();
