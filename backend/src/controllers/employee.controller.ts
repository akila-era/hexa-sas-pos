import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import employeeService from '../services/employee.service';
import { transformEmployee } from '../utils/transformers';

export class EmployeeController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { branchId, departmentId, designationId, employmentType, isActive, search, page, limit, sortBy, sortOrder } = req.query;

      const result = await employeeService.findAll({
        tenantId,
        branchId: branchId as string,
        departmentId: departmentId as string,
        designationId: designationId as string,
        employmentType: employmentType as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      });

      // Transform data to match frontend format
      const transformedEmployees = result.employees.map(transformEmployee);

      const response: ApiResponse = {
        success: true,
        data: transformedEmployees,
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

      const employee = await employeeService.findById(req.params.id, tenantId);

      const response: ApiResponse = {
        success: true,
        data: employee,
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

      const employee = await employeeService.create({
        tenantId,
        ...req.body,
      });

      const response: ApiResponse = {
        success: true,
        data: employee,
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

      const employee = await employeeService.update(req.params.id, tenantId, req.body);

      const response: ApiResponse = {
        success: true,
        data: employee,
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

      await employeeService.delete(req.params.id, tenantId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async getAttendanceSummary(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { month, year } = req.query;
      const now = new Date();

      const summary = await employeeService.getAttendanceSummary(
        req.params.id,
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

export default new EmployeeController();

