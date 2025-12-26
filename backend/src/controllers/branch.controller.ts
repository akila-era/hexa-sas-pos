import { Response } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import branchService from '../services/branch.service';
import { errorHandler } from '../middlewares/error.middleware';

export class BranchController {
  async create(req: AuthRequest, res: Response) {
    try {
      const branch = await branchService.create(req.companyId!, req.body);

      const response: ApiResponse = {
        success: true,
        data: branch,
      };

      res.status(201).json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    try {
      const branches = await branchService.findAll(req.companyId!, req.query as any);

      const response: ApiResponse = {
        success: true,
        data: branches,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  async findOne(req: AuthRequest, res: Response) {
    try {
      const branch = await branchService.findOne(
        req.companyId!,
        req.params.id
      );

      const response: ApiResponse = {
        success: true,
        data: branch,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      const branch = await branchService.update(
        req.companyId!,
        req.params.id,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: branch,
      };

      res.json(response);
    } catch (error) {
      errorHandler(error as Error, req, res, () => {});
    }
  }
}

export default new BranchController();

