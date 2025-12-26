import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import companyService from '../services/company.service';
import { errorHandler } from '../middlewares/error.middleware';

export class CompanyController {
  async create(req: AuthRequest, res: Response) {
    try {
      const company = await companyService.create(req.body);

      const response: ApiResponse = {
        success: true,
        data: company,
      };

      res.status(201).json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    try {
      const result = await companyService.findAll(req.query as any);

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

  async update(req: AuthRequest, res: Response) {
    try {
      const company = await companyService.update(
        req.params.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: company,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new CompanyController();

