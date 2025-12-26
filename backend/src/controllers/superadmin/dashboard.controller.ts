import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../../types';
import { dashboardService } from '../../services/superadmin';
import { errorHandler } from '../../middlewares/error.middleware';

export class DashboardController {
  /**
   * Get dashboard statistics
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await dashboardService.getStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get revenue chart data
   */
  async getRevenueData(req: AuthRequest, res: Response) {
    try {
      const year = req.query.year
        ? parseInt(req.query.year as string, 10)
        : new Date().getFullYear();

      const data = await dashboardService.getRevenueData(year);

      const response: ApiResponse = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 5;

      const transactions = await dashboardService.getRecentTransactions(limit);

      const response: ApiResponse = {
        success: true,
        data: transactions,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get recently registered companies
   */
  async getRecentlyRegistered(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 5;

      const companies = await dashboardService.getRecentlyRegistered(limit);

      const response: ApiResponse = {
        success: true,
        data: companies,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get companies with expired plans
   */
  async getExpiredPlans(req: AuthRequest, res: Response) {
    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 5;

      const expired = await dashboardService.getExpiredPlans(limit);

      const response: ApiResponse = {
        success: true,
        data: expired,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get company chart data
   */
  async getCompanyChartData(req: AuthRequest, res: Response) {
    try {
      const data = await dashboardService.getCompanyChartData();

      const response: ApiResponse = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get plan distribution for pie chart
   */
  async getPlanDistribution(req: AuthRequest, res: Response) {
    try {
      const data = await dashboardService.getPlanDistribution();

      const response: ApiResponse = {
        success: true,
        data,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new DashboardController();









