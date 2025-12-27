import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import purchaseService from '../services/purchase.service';
import { transformPurchase } from '../utils/transformers';

export class PurchaseController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const { branchId, supplierId, status, paymentStatus, startDate, endDate, search, page, limit, sortBy, sortOrder } = req.query;

      const result = await purchaseService.findAll({
        tenantId,
        branchId: branchId as string,
        supplierId: supplierId as string,
        status: status as string,
        paymentStatus: paymentStatus as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      // Transform data to match frontend format
      const transformedPurchases = result.purchases.map(transformPurchase);

      const response: ApiResponse = {
        success: true,
        data: transformedPurchases,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const purchase = await purchaseService.findById(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: purchase,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const purchase = await purchaseService.create({
        tenantId,
        createdBy: req.user?.id,
        ...req.body,
      });

      const response: ApiResponse = {
        success: true,
        data: purchase,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async addPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const purchase = await purchaseService.addPayment(req.params.id, tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        data: purchase,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const purchase = await purchaseService.update(req.params.id, tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        data: purchase,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      await purchaseService.delete(req.params.id, tenantId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new PurchaseController();

