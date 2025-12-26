import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import stockService from '../services/stock.service';

/**
 * Stock Controller
 * 
 * Handles HTTP requests for Stock operations.
 * All methods ensure tenant isolation through middleware.
 */
export class StockController {
  /**
   * Create a stock movement
   * POST /api/v1/stock/movements
   */
  async createMovement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new Error('Tenant context is required');
      }

      const movement = await stockService.createStockMovement(
        req.companyId!,
        {
          ...req.body,
          createdBy: req.user?.id,
        }
      );

      const response: ApiResponse = {
        success: true,
        data: movement,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock for a specific product and warehouse
   * GET /api/v1/stock/:productId/:warehouseId
   */
  async getStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new Error('Tenant context is required');
      }

      const productId = req.params.productId;
      const warehouseId = req.params.warehouseId;

      if (!productId || !warehouseId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Invalid productId or warehouseId',
          },
        });
      }

      const stock = await stockService.getStock(
        req.companyId!,
        productId,
        warehouseId
      );

      const response: ApiResponse = {
        success: true,
        data: stock,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock movements with filters
   * GET /api/v1/stock/movements?productId=1&warehouseId=1&page=1&limit=10
   */
  async getMovements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new Error('Tenant context is required');
      }

      const result = await stockService.getStockMovements(
        req.companyId!,
        req.query as any
      );

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
   * Check stock availability for multiple items
   * POST /api/v1/stock/check-availability
   * Body: { items: [{ productId, quantity, warehouseId }] }
   */
  async checkAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new Error('Tenant context is required');
      }

      if (!req.body.items || !Array.isArray(req.body.items)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Items array is required',
          },
        });
      }

      const result = await stockService.checkStockAvailability(
        req.companyId!,
        req.body.items
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new StockController();

