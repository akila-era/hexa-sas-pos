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

  /**
   * Get purchase report
   * GET /api/v1/reports/purchases
   */
  async getPurchaseReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) {
        filters.branchId = req.query.branchId as string;
      }
      if (req.query.warehouseId) {
        filters.warehouseId = req.query.warehouseId as string;
      }
      if (req.query.productId) {
        filters.productId = req.query.productId as string;
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const result = await reportService.getPurchaseReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get purchase order report
   * GET /api/v1/reports/purchase-orders
   */
  async getPurchaseOrderReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) {
        filters.branchId = req.query.branchId as string;
      }
      if (req.query.supplierId) {
        filters.supplierId = req.query.supplierId as string;
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }
      if (req.query.search) {
        filters.search = req.query.search as string;
      }

      const result = await reportService.getPurchaseOrderReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get balance sheet
   * GET /api/v1/reports/balance-sheet
   */
  async getBalanceSheet(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) {
        filters.branchId = req.query.branchId as string;
      }
      if (req.query.asOfDate) {
        filters.asOfDate = new Date(req.query.asOfDate as string);
      }

      const result = await reportService.getBalanceSheet(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get trial balance
   * GET /api/v1/reports/trial-balance
   */
  async getTrialBalance(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) {
        filters.branchId = req.query.branchId as string;
      }
      if (req.query.asOfDate) {
        filters.asOfDate = new Date(req.query.asOfDate as string);
      }

      const result = await reportService.getTrialBalance(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get cash flow
   * GET /api/v1/reports/cash-flow
   */
  async getCashFlow(req: AuthRequest, res: Response) {
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
      if (req.query.paymentMethod) {
        filters.paymentMethod = req.query.paymentMethod as string;
      }

      const result = await reportService.getCashFlow(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get invoice report
   * GET /api/v1/reports/invoices
   */
  async getInvoiceReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.status) filters.status = req.query.status as string;

      const result = await reportService.getInvoiceReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get stock history report
   * GET /api/v1/reports/stock-history
   */
  async getStockHistory(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.productId) filters.productId = req.query.productId as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await reportService.getStockHistory(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get sold stock report
   * GET /api/v1/reports/sold-stock
   */
  async getSoldStock(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.productId) filters.productId = req.query.productId as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await reportService.getSoldStock(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get supplier report
   * GET /api/v1/reports/suppliers
   */
  async getSupplierReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.supplierId) filters.supplierId = req.query.supplierId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;

      const result = await reportService.getSupplierReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get supplier due report
   * GET /api/v1/reports/supplier-due
   */
  async getSupplierDueReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.supplierId) filters.supplierId = req.query.supplierId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;

      const result = await reportService.getSupplierDueReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get customer report
   * GET /api/v1/reports/customers
   */
  async getCustomerReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;
      if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus as string;

      const result = await reportService.getCustomerReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get customer due report
   * GET /api/v1/reports/customer-due
   */
  async getCustomerDueReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;
      if (req.query.paymentStatus) filters.paymentStatus = req.query.paymentStatus as string;

      const result = await reportService.getCustomerDueReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get product report
   * GET /api/v1/reports/products
   */
  async getProductReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.productId) filters.productId = req.query.productId as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.brandId) filters.brandId = req.query.brandId as string;
      if (req.query.storeId) filters.storeId = req.query.storeId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await reportService.getProductReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get product expiry report
   * GET /api/v1/reports/products/expired
   */
  async getProductExpiryReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.productId) filters.productId = req.query.productId as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.brandId) filters.brandId = req.query.brandId as string;
      if (req.query.storeId) filters.storeId = req.query.storeId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await reportService.getProductExpiryReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get product quantity alert
   * GET /api/v1/reports/products/quantity-alert
   */
  async getProductQuantityAlert(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.productId) filters.productId = req.query.productId as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.brandId) filters.brandId = req.query.brandId as string;
      if (req.query.storeId) filters.storeId = req.query.storeId as string;

      const result = await reportService.getProductQuantityAlert(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get expense report
   * GET /api/v1/reports/expenses
   */
  async getExpenseReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;

      const result = await reportService.getExpenseReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get income report
   * GET /api/v1/reports/income
   */
  async getIncomeReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.categoryId) filters.categoryId = req.query.categoryId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;

      const result = await reportService.getIncomeReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get purchase tax report
   * GET /api/v1/reports/tax/purchase
   */
  async getPurchaseTaxReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.supplierId) filters.supplierId = req.query.supplierId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;

      const result = await reportService.getPurchaseTaxReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get sales tax report
   * GET /api/v1/reports/tax/sales
   */
  async getSalesTaxReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.customerId) filters.customerId = req.query.customerId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);
      if (req.query.paymentMethod) filters.paymentMethod = req.query.paymentMethod as string;

      const result = await reportService.getSalesTaxReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get profit/loss report
   * GET /api/v1/reports/profit-loss
   */
  async getProfitLossReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.startDate) filters.startDate = new Date(req.query.startDate as string);
      if (req.query.endDate) filters.endDate = new Date(req.query.endDate as string);

      const result = await reportService.getProfitLossReport(req.companyId!, filters);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get annual report
   * GET /api/v1/reports/annual
   */
  async getAnnualReport(req: AuthRequest, res: Response) {
    try {
      const filters: any = {};
      if (req.query.branchId) filters.branchId = req.query.branchId as string;
      if (req.query.year) filters.year = parseInt(req.query.year as string);

      const result = await reportService.getAnnualReport(req.companyId!, filters);

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

