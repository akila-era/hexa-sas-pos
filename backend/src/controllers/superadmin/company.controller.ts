import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../../types';
import { companyService } from '../../services/superadmin';
import { errorHandler } from '../../middlewares/error.middleware';
import {
  superAdminCompanyCreateSchema,
  superAdminCompanyUpdateSchema,
  companyUpgradeSchema,
  companyFilterSchema,
} from '../../utils/superadmin.validation';

export class CompanyController {
  /**
   * Create a new company
   */
  async create(req: AuthRequest, res: Response) {
    try {
      const validated = superAdminCompanyCreateSchema.parse(req.body);
      const company = await companyService.create(validated);

      const response: ApiResponse = {
        success: true,
        data: company,
      };

      res.status(201).json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get all companies
   */
  async findAll(req: AuthRequest, res: Response) {
    try {
      const filters = companyFilterSchema.parse(req.query);
      const result = await companyService.findAll(filters);

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
   * Get a single company
   */
  async findOne(req: AuthRequest, res: Response) {
    try {
      const company = await companyService.findOne(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: company,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Update a company
   */
  async update(req: AuthRequest, res: Response) {
    try {
      const validated = superAdminCompanyUpdateSchema.parse(req.body);
      const company = await companyService.update(req.params.id, validated);

      const response: ApiResponse = {
        success: true,
        data: company,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Delete (deactivate) a company
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      const result = await companyService.delete(req.params.id);

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
   * Upgrade company plan
   */
  async upgradePlan(req: AuthRequest, res: Response) {
    try {
      const validated = companyUpgradeSchema.parse(req.body);
      const subscription = await companyService.upgradePlan(
        req.params.id,
        validated
      );

      const response: ApiResponse = {
        success: true,
        data: subscription,
        message: 'Company plan upgraded successfully',
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  /**
   * Get company statistics
   */
  async getStats(req: AuthRequest, res: Response) {
    try {
      const stats = await companyService.getStats();

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
   * Toggle company status
   */
  async toggleStatus(req: AuthRequest, res: Response) {
    try {
      const company = await companyService.toggleStatus(req.params.id);

      const response: ApiResponse = {
        success: true,
        data: company,
        message: `Company ${company.isActive ? 'activated' : 'deactivated'} successfully`,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new CompanyController();









