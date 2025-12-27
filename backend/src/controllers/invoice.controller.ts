import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import invoiceService from '../services/invoice.service';

/**
 * Invoice Controller
 */
export class InvoiceController {
  /**
   * Get all invoices
   * GET /api/v1/invoices
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

      const result = await invoiceService.findAll(tenantId, {
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
   * Get overdue invoices
   * GET /api/v1/invoices/overdue
   */
  async getOverdue(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const result = await invoiceService.getOverdue(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single invoice
   * GET /api/v1/invoices/:id
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

      const invoice = await invoiceService.findOne(tenantId, req.params.id);
      res.json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create invoice
   * POST /api/v1/invoices
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

      const invoice = await invoiceService.create(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: invoice, message: 'Invoice created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update invoice
   * PUT /api/v1/invoices/:id
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

      const invoice = await invoiceService.update(tenantId, req.params.id, req.body);
      res.json({ success: true, data: invoice, message: 'Invoice updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add payment to invoice
   * POST /api/v1/invoices/:id/payment
   */
  async addPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const payment = await invoiceService.addPayment(tenantId, req.params.id, req.body);
      res.status(201).json({ success: true, data: payment, message: 'Payment added successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete invoice
   * DELETE /api/v1/invoices/:id
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

      const result = await invoiceService.delete(tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new InvoiceController();
