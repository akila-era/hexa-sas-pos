import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../../types';
import { transactionService } from '../../services/superadmin';
import { errorHandler } from '../../middlewares/error.middleware';
import {
  transactionCreateSchema,
  transactionFilterSchema,
} from '../../utils/superadmin.validation';

export class TransactionController {
  /**
   * Create a new transaction
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const validated = transactionCreateSchema.parse(req.body);
      const transaction = await transactionService.create(validated);

      const response: ApiResponse = {
        success: true,
        data: transaction,
      };

      res.status(201).json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get all transactions
   */
  async findAll(req: AuthRequest, res: Response) {
    try {
      const filters = transactionFilterSchema.parse(req.query);
      const result = await transactionService.findAll(filters);

      const response: ApiResponse = {
        success: true,
        data: result.data,
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get a single transaction
   */
  async findOne(req: AuthRequest, res: Response) {
    try {
      const transaction = await transactionService.findOne(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: transaction,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get transaction by invoice ID
   */
  async findByInvoice(req: AuthRequest, res: Response) {
    try {
      const transaction = await transactionService.findByInvoiceId(
        req.params.invoiceId
      );

      const response: ApiResponse = {
        success: true,
        data: transaction,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Update transaction status
   */
  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const { status } = req.body;
      const transaction = await transactionService.updateStatus(
        req.params.id,
        status
      );

      const response: ApiResponse = {
        success: true,
        data: transaction,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Delete a transaction
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const result = await transactionService.delete(req.params.id);

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
   * Get transaction statistics
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await transactionService.getStats();

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
   * Generate a new invoice ID
   */
  async generateInvoiceId(req: AuthRequest, res: Response) {
    try {
      const invoiceId = await transactionService.generateInvoiceId();

      const response: ApiResponse = {
        success: true,
        data: { invoiceId },
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new TransactionController();









