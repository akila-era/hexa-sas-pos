import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../../types';
import { subscriptionService } from '../../services/superadmin';
import { errorHandler } from '../../middlewares/error.middleware';
import {
  subscriptionCreateSchema,
  subscriptionFilterSchema,
} from '../../utils/superadmin.validation';

export class SubscriptionController {
  /**
   * Create a new subscription
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const validated = subscriptionCreateSchema.parse(req.body);
      const subscription = await subscriptionService.create(validated);

      const response: ApiResponse = {
        success: true,
        data: subscription,
      };

      res.status(201).json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get all subscriptions
   */
  async findAll(req: AuthRequest, res: Response) {
    try {
      const filters = subscriptionFilterSchema.parse(req.query);
      const result = await subscriptionService.findAll(filters);

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
   * Get a single subscription
   */
  async findOne(req: AuthRequest, res: Response) {
    try {
      const subscription = await subscriptionService.findOne(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: subscription,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Delete a subscription
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const result = await subscriptionService.delete(req.params.id);

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
   * Get subscription statistics
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await subscriptionService.getStats();

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
   * Update expired subscriptions
   */
  async updateExpired(req: AuthRequest, res: Response) {
    try {
      const result = await subscriptionService.updateExpiredSubscriptions();

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

export default new SubscriptionController();









