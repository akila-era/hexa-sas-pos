import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import onlineOrderService from '../services/online-order.service';

/**
 * Online Order Controller
 */
export class OnlineOrderController {
  /**
   * Get all online orders
   * GET /api/v1/online-orders
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

      const result = await onlineOrderService.findAll(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
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
   * Get single online order
   * GET /api/v1/online-orders/:id
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

      const order = await onlineOrderService.findOne(tenantId, req.params.id);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create online order
   * POST /api/v1/online-orders
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

      const order = await onlineOrderService.create(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: order, message: 'Online order created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update online order
   * PUT /api/v1/online-orders/:id
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

      const order = await onlineOrderService.update(tenantId, req.params.id, req.body);
      res.json({ success: true, data: order, message: 'Online order updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete online order
   * DELETE /api/v1/online-orders/:id
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

      const result = await onlineOrderService.delete(tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payments for an order
   * GET /api/v1/online-orders/:id/payments
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

      const payments = await onlineOrderService.getPayments(tenantId, req.params.id);
      res.json({ success: true, data: payments });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create payment for an order
   * POST /api/v1/online-orders/:id/payments
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

      const payment = await onlineOrderService.createPayment(tenantId, req.params.id, req.body);
      res.status(201).json({ success: true, data: payment, message: 'Payment created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update payment
   * PUT /api/v1/online-orders/:id/payments/:paymentId
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

      const payment = await onlineOrderService.updatePayment(tenantId, req.params.id, req.params.paymentId, req.body);
      res.json({ success: true, data: payment, message: 'Payment updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete payment
   * DELETE /api/v1/online-orders/:id/payments/:paymentId
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

      const result = await onlineOrderService.deletePayment(tenantId, req.params.id, req.params.paymentId);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}

export default new OnlineOrderController();

