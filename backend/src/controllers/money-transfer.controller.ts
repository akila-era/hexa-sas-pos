import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import moneyTransferService from '../services/money-transfer.service';

export class MoneyTransferController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.companyId || req.tenantId || req.user?.tenantId;
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'TENANT_CONTEXT_REQUIRED', message: 'Tenant context is required' },
        });
      }

      const { fromAccountId, toAccountId, startDate, endDate, page, limit } = req.query;

      const result = await moneyTransferService.findAll({
        tenantId,
        fromAccountId: fromAccountId as string,
        toAccountId: toAccountId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      const response: ApiResponse = {
        success: true,
        data: result.transfers,
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

      const transfer = await moneyTransferService.findById(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: transfer,
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

      const transfer = await moneyTransferService.create({
        tenantId,
        createdBy: req.user?.id,
        ...req.body,
      });

      const response: ApiResponse = {
        success: true,
        data: transfer,
      };

      res.status(201).json(response);
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

      await moneyTransferService.delete(req.params.id, tenantId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export default new MoneyTransferController();

