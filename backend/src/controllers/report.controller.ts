import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import reportService from '../services/report.service';
import { errorHandler } from '../middlewares/error.middleware';

export class ReportController {
  async getSalesSummary(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) {
        filters.branchId = parseInt(req.query.branchId as string);
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const result = await reportService.getSalesSummary(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  async getTopProducts(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) {
        filters.branchId = req.query.branchId as string;
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string);
      }

      const result = await reportService.getTopProducts(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  async getInventorySummary(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId
        ? (req.query.branchId as string)
        : undefined;

      const result = await reportService.getInventorySummary(
        req.companyId!,
        branchId
      );

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  async getDailySales(req: AuthRequest, res: Response) {
    try {
      if (!req.query.startDate || !req.query.endDate) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_DATES',
            message: 'startDate and endDate are required',
          },
        });
      }

      const filters: any = {
        startDate: new Date(req.query.startDate as string),
        endDate: new Date(req.query.endDate as string),
      };

      if (req.query.branchId) {
        filters.branchId = parseInt(req.query.branchId as string);
      }

      const result = await reportService.getDailySales(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new ReportController();

