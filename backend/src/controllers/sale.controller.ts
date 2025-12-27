import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import saleService from '../services/sale.service';

/**
 * Sale Controller
 * Handles HTTP requests for Sale operations.
 */
export class SaleController {
  /**
   * Get all sales with filters
   * GET /api/v1/sales
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

      const result = await saleService.findAll(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        branchId: req.query.branchId as string,
        customerId: req.query.customerId as string,
        status: req.query.status as string,
        paymentStatus: req.query.paymentStatus as string,
        search: req.query.search as string,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single sale by ID
   * GET /api/v1/sales/:id
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

      const sale = await saleService.findOne(tenantId, req.params.id);
      res.json({ success: true, data: sale });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new sale
   * POST /api/v1/sales
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

      const sale = await saleService.create(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: sale, message: 'Sale created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update sale
   * PUT /api/v1/sales/:id
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

      const sale = await saleService.update(tenantId, req.params.id, req.body);
      res.json({ success: true, data: sale, message: 'Sale updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete sale
   * DELETE /api/v1/sales/:id
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

      const result = await saleService.delete(tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payments for a sale
   * GET /api/v1/sales/:id/payments
   */
  async getPayments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const payments = await saleService.getPayments(tenantId, req.params.id);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create payment for a sale
   * POST /api/v1/sales/:id/payments
   */
  async createPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const payment = await saleService.createPayment(tenantId, req.params.id, req.body);
      res.status(201).json({ success: true, data: payment, message: 'Payment created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update payment
   * PUT /api/v1/sales/:id/payments/:paymentId
   */
  async updatePayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const payment = await saleService.updatePayment(tenantId, req.params.id, req.params.paymentId, req.body);
      res.json({ success: true, data: payment, message: 'Payment updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete payment
   * DELETE /api/v1/sales/:id/payments/:paymentId
   */
  async deletePayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const result = await saleService.deletePayment(tenantId, req.params.id, req.params.paymentId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new SaleController();
