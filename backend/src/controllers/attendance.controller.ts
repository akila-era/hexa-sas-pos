import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import attendanceService from '../services/attendance.service';
import { transformAttendance } from '../utils/transformers';

export class AttendanceController {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { branchId, employeeId, status, startDate, endDate, page, limit } = req.query;

      const result = await attendanceService.findAll({
        tenantId,
        branchId: branchId as string,
        employeeId: employeeId as string,
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 10,
      });

      // Transform data to match frontend format
      const transformedAttendances = result.attendances.map(transformAttendance);

      const response: ApiResponse = {
        success: true,
        data: transformedAttendances,
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

  async clockIn(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { employeeId, branchId, note } = req.body;

      const attendance = await attendanceService.clockIn({
        employeeId,
        branchId,
        note,
      });

      const response: ApiResponse = {
        success: true,
        data: attendance,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async clockOut(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { employeeId, note } = req.body;

      const attendance = await attendanceService.clockOut({
        employeeId,
        note,
      });

      const response: ApiResponse = {
        success: true,
        data: attendance,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async markAbsent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { employeeId, date, note } = req.body;

      const attendance = await attendanceService.markAbsent(
        employeeId,
        new Date(date),
        note
      );

      const response: ApiResponse = {
        success: true,
        data: attendance,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getEmployeeAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { month, year } = req.query;
      const now = new Date();

      const attendances = await attendanceService.getEmployeeAttendance(
        req.params.employeeId,
        month ? parseInt(month as string) : now.getMonth() + 1,
        year ? parseInt(year as string) : now.getFullYear()
      );

      const response: ApiResponse = {
        success: true,
        data: attendances,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async getTodayAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const { branchId } = req.query;

      const result = await attendanceService.getTodayAttendance(
        tenantId,
        branchId as string
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

export default new AttendanceController();

