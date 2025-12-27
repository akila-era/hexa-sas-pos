import { Request, Response, NextFunction } from 'express';
import stockService from '../services/stock.service';

// Extend Request to include tenantId and user
interface AuthRequest extends Request {
  tenantId?: string;
  companyId?: string;
  user?: { id: string };
}

/**
 * Stock Controller
 * Handles HTTP requests for Stock operations
 */
export class StockController {
  // =====================
  // MANAGE STOCK
  // =====================

  /**
   * Get all stock items
   * GET /api/v1/stock
   */
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.getAllStock(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        warehouseId: req.query.warehouseId as string,
        productId: req.query.productId as string,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add stock
   * POST /api/v1/stock
   */
  async addStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.addStock(tenantId, req.body, req.user?.id);
      res.status(201).json({ success: true, data: result, message: 'Stock added successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update stock
   * PUT /api/v1/stock/:id
   */
  async updateStock(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const { quantity } = req.body;
      const result = await stockService.updateStock(tenantId, req.params.id, quantity, req.user?.id);
      res.json({ success: true, data: result, message: 'Stock updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  // =====================
  // STOCK ADJUSTMENTS
  // =====================

  /**
   * Get all adjustments
   * GET /api/v1/stock/adjustments
   */
  async getAllAdjustments(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.getAllAdjustments(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        warehouseId: req.query.warehouseId as string,
        type: req.query.type as 'ADD' | 'SUBTRACT',
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create adjustment
   * POST /api/v1/stock/adjustments
   */
  async createAdjustment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.createAdjustment(tenantId, req.body, req.user?.id);
      res.status(201).json({ success: true, data: result, message: 'Adjustment created successfully' });
    } catch (error) {
      next(error);
    }
  }

  // =====================
  // STOCK TRANSFERS
  // =====================

  /**
   * Get all transfers
   * GET /api/v1/stock/transfers
   */
  async getAllTransfers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.getAllTransfers(tenantId, {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        fromWarehouseId: req.query.fromWarehouseId as string,
        toWarehouseId: req.query.toWarehouseId as string,
        status: req.query.status as string,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single transfer
   * GET /api/v1/stock/transfers/:id
   */
  async getTransferById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.getTransferById(tenantId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create transfer
   * POST /api/v1/stock/transfers
   */
  async createTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.createTransfer(tenantId, req.body, req.user?.id);
      res.status(201).json({ success: true, data: result, message: 'Transfer created successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete transfer
   * DELETE /api/v1/stock/transfers/:id
   */
  async deleteTransfer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.deleteTransfer(tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  // =====================
  // EXISTING ENDPOINTS
  // =====================

  /**
   * Create a stock movement
   * POST /api/v1/stock/movements
   */
  async createMovement(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const movement = await stockService.createStockMovement(tenantId, {
        ...req.body,
        createdBy: req.user?.id,
      });

      res.status(201).json({ success: true, data: movement });
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
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const { productId, warehouseId } = req.params;
      if (!productId || !warehouseId) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_PARAMS', message: 'Invalid productId or warehouseId' },
        });
      }

      const stock = await stockService.getStock(tenantId, productId, warehouseId);
      res.json({ success: true, data: stock });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock movements with filters
   * GET /api/v1/stock/movements
   */
  async getMovements(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      const result = await stockService.getStockMovements(tenantId, req.query as any);
      res.json({ success: true, data: result.data, pagination: result.pagination });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Check stock availability
   * POST /api/v1/stock/check-availability
   */
  async checkAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.tenantId || req.companyId;
      if (!tenantId) throw new Error('Tenant context is required');

      if (!req.body.items || !Array.isArray(req.body.items)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'Items array is required' },
        });
      }

      const result = await stockService.checkStockAvailability(tenantId, req.body.items);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

export default new StockController();
