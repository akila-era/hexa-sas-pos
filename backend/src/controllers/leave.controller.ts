import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import leaveService from '../services/leave.service';
import { transformLeave } from '../utils/transformers';

export class LeaveController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { employeeId, leaveTypeId, status, startDate, endDate, page, limit } = req.query;

      const result = await leaveService.findAll({
        tenantId,
        employeeId: employeeId as string,
        leaveTypeId: leaveTypeId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      // Transform data to match frontend format
      const transformedLeaves = result.leaves.map(transformLeave);

      const response: ApiResponse = {
        success: true,
        data: transformedLeaves,
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
      const leave = await leaveService.findById(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: leave,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leave = await leaveService.create(req.body);

      const response: ApiResponse = {
        success: true,
        data: leave,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async approve(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const leave = await leaveService.approve(req.params.id, userId);

      const response: ApiResponse = {
        success: true,
        data: leave,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async reject(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { reason } = req.body;
      const leave = await leaveService.reject(req.params.id, userId, reason);

      const response: ApiResponse = {
        success: true,
        data: leave,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const leave = await leaveService.cancel(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: leave,
      };

      res.json(response);
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

      const balance = await leaveService.getLeaveBalance(req.params.employeeId, tenantId);

      const response: ApiResponse = {
        success: true,
        data: balance,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new LeaveController();

