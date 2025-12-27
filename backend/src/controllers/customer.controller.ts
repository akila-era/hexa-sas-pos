import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import customerService from '../services/customer.service';
import { transformCustomer } from '../utils/transformers';

export class CustomerController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { search, isActive, page, limit, sortBy, sortOrder } = req.query;

      const result = await customerService.findAll({
        tenantId,
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      // Transform data to match frontend format
      const transformedCustomers = result.customers.map(transformCustomer);

      const response: ApiResponse = {
        success: true,
        data: transformedCustomers,
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
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const customer = await customerService.findById(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: customer,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const customer = await customerService.create({
        tenantId,
        ...req.body,
      });

      const response: ApiResponse = {
        success: true,
        data: customer,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const customer = await customerService.update(req.params.id, tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        data: customer,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      await customerService.delete(req.params.id, tenantId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getBalance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const balance = await customerService.getBalance(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: balance,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getSalesHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { page, limit } = req.query;
      const result = await customerService.getSalesHistory(
        req.params.id,
        tenantId,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 10
      );

      const response: ApiResponse = {
        success: true,
        data: result.sales,
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
}

export default new CustomerController();

