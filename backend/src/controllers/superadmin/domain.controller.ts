import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../../types';
import { domainService } from '../../services/superadmin';
import { errorHandler } from '../../middlewares/error.middleware';
import {
  domainCreateSchema,
  domainFilterSchema,
} from '../../utils/superadmin.validation';

export class DomainController {
  /**
   * Create a new domain request
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const validated = domainCreateSchema.parse(req.body);
      const domain = await domainService.create(validated);

      const response: ApiResponse = {
        success: true,
        data: domain,
      };

      res.status(201).json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get all domains
   */
  async findAll(req: AuthRequest, res: Response) {
    try {
      const filters = domainFilterSchema.parse(req.query);
      const result = await domainService.findAll(filters);

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
   * Get a single domain
   */
  async findOne(req: AuthRequest, res: Response) {
    try {
      const domain = await domainService.findOne(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: domain,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Approve a domain
   */
  async approve(req: AuthRequest, res: Response) {
    try {
      const domain = await domainService.approve(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: domain,
        message: 'Domain approved successfully',
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Reject a domain
   */
  async reject(req: AuthRequest, res: Response) {
    try {
      const domain = await domainService.reject(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: domain,
        message: 'Domain rejected successfully',
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Delete a domain
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const result = await domainService.delete(req.params.id);

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
   * Get domain statistics
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await domainService.getStats();

      const response: ApiResponse = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new DomainController();









