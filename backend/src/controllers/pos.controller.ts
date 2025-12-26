import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import posService from '../services/pos.service';

/**
 * POS Controller
 * 
 * Handles HTTP requests for POS operations.
 * All methods ensure tenant isolation through middleware.
 */
export class PosController {
  /**
   * Create a POS order (checkout)
   * POST /api/v1/pos/orders
   */
  async createOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId || !req.user) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Tenant context and user authentication required',
          },
        });
      }

      const order = await posService.createOrder(
        String(req.companyId),
        req.branchId ? String(req.branchId) : '',
        String(req.user.id),
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: order,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all POS orders with filters
   * GET /api/v1/pos/orders?branchId=1&customerId=1&page=1&limit=10
   */
  async getOrders(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Tenant context is required',
          },
        });
      }

      const result = await posService.getOrders(String(req.companyId), req.query as any);

      const response: ApiResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single POS order by ID
   * GET /api/v1/pos/orders/:id
   */
  async getOrder(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        return res.status(403).json({
          success: false,
          error: {
            code: 'TENANT_CONTEXT_REQUIRED',
            message: 'Tenant context is required',
          },
        });
      }

      const orderId = req.params.id;
      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ORDER_ID',
            message: 'Invalid order ID',
          },
        });
      }

      const order = await posService.getOrder(String(req.companyId), orderId);

      const response: ApiResponse = {
        success: true,
        data: order,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new PosController();

