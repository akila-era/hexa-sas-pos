import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import payrollService from '../services/payroll.service';
import { transformPayroll } from '../utils/transformers';

export class PayrollController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { employeeId, month, year, status, page, limit } = req.query;

      const result = await payrollService.findAll({
        tenantId,
        employeeId: employeeId as string,
        month: month ? parseInt(month as string) : undefined,
        year: year ? parseInt(year as string) : undefined,
        status: status as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      // Transform data to match frontend format
      const transformedPayrolls = result.payrolls.map(transformPayroll);

      const response: ApiResponse = {
        success: true,
        data: transformedPayrolls,
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
      const payroll = await payrollService.findById(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: payroll,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async generate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { month, year, employeeIds } = req.body;

      const payrolls = await payrollService.generate({
        tenantId,
        month,
        year,
        employeeIds,
      });

      const response: ApiResponse = {
        success: true,
        data: payrolls,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  async process(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const payroll = await payrollService.process(req.params.id, req.body);

      const response: ApiResponse = {
        success: true,
        data: payroll,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async markAsPaid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { paymentMethod } = req.body;
      const payroll = await payrollService.markAsPaid(req.params.id, paymentMethod);

      const response: ApiResponse = {
        success: true,
        data: payroll,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async bulkMarkAsPaid(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { ids, paymentMethod } = req.body;
      const result = await payrollService.bulkMarkAsPaid(ids, paymentMethod);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { month, year } = req.query;
      const now = new Date();

      const summary = await payrollService.getPayrollSummary(
        tenantId,
        month ? parseInt(month as string) : now.getMonth() + 1,
        year ? parseInt(year as string) : now.getFullYear()
      );

      const response: ApiResponse = {
        success: true,
        data: summary,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new PayrollController();

