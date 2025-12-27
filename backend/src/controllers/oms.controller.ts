import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import omsService from '../services/oms.service';

/**
 * OMS Controller
 * Handles HTTP requests for Order Management System operations.
 */
export class OmsController {
  /**
   * Get all orders with filters
   * GET /api/v1/oms/orders
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

      const result = await omsService.findAll(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
        branchId: req.query.branchId as string,
        customerId: req.query.customerId as string,
        status: req.query.status as string,
        paymentStatus: req.query.paymentStatus as string,
        search: req.query.search as string,
        isDeliveryReady: req.query.isDeliveryReady === 'true' ? true : 
                        req.query.isDeliveryReady === 'false' ? false : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single order by ID
   * GET /api/v1/oms/orders/:id
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

      const order = await omsService.findOne(tenantId, req.params.id);
      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new order
   * POST /api/v1/oms/orders
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

      const order = await omsService.create(tenantId, userId, req.body);
      res.status(201).json({ 
        success: true, 
        data: order, 
        message: 'Order created successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update order
   * PUT /api/v1/oms/orders/:id
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }

      const order = await omsService.update(tenantId, userId, req.params.id, req.body);
      res.json({ 
        success: true, 
        data: order, 
        message: 'Order updated successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add payment to order
   * POST /api/v1/oms/orders/:id/payment
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

      const order = await omsService.addPayment(tenantId, req.params.id, req.body);
      res.json({ 
        success: true, 
        data: order, 
        message: 'Payment added successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel order
   * DELETE /api/v1/oms/orders/:id
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      const userId = req.user?.id;
      if (!tenantId || !userId) {
        return res.status(403).json({
          success: false,
          error: { code: 'AUTH_REQUIRED', message: 'Authentication required' },
        });
      }

      const order = await omsService.delete(
        tenantId, 
        userId, 
        req.params.id, 
        req.body.reason
      );
      res.json({ 
        success: true, 
        data: order, 
        message: 'Order cancelled successfully' 
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get order statistics
   * GET /api/v1/oms/stats
   */
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const stats = await omsService.getStats(tenantId, {
        branchId: req.query.branchId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      });

      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  }
}

export default new OmsController();

