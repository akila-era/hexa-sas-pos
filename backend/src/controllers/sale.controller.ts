import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import saleService from '../services/sale.service';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';

/**
 * Sale Controller
 * 
 * Handles HTTP requests for Sale operations.
 * All methods ensure tenant isolation through middleware.
 */
export class SaleController {
  /**
   * Create a new sale
   * POST /api/v1/sales
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
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

      // Note: Sale creation is handled through POS orders in the new schema
      // This method may need to be refactored to work with POS orders
      throw new AppErrorClass(
        'Sale creation should be done through POS orders',
        400,
        'INVALID_OPERATION'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all sales with filters
   * GET /api/v1/sales?branchId=1&customerId=1&page=1&limit=10
   */
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
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

      const result = await saleService.findAll(req.companyId!, req.query as any);

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
   * Get a single sale by ID
   * GET /api/v1/sales/:id
   */
  async findOne(req: AuthRequest, res: Response, next: NextFunction) {
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

      const saleId = req.params.id;
      if (!saleId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SALE_ID',
            message: 'Invalid sale ID',
          },
        });
      }

      const sale = await saleService.findOne(req.companyId!, saleId);

      const response: ApiResponse = {
        success: true,
        data: sale,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new SaleController();

