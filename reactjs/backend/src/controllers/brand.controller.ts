import { Request, Response, NextFunction } from 'express';
import { brandService } from '../services/brand.service';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';
import { brandQuerySchema, createBrandSchema, updateBrandSchema } from '../validators/brand.validators';

export const brandController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = brandQuerySchema.parse(req.query);
      const { brands, total, page, limit } = await brandService.findAll(query);
      return sendPaginated(res, brands, total, page, limit, 'Brands retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const brand = await brandService.findById(id);
      return sendSuccess(res, brand, 'Brand retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createBrandSchema.parse(req.body);
      const brand = await brandService.create(data);
      return sendCreated(res, brand, 'Brand created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = updateBrandSchema.parse(req.body);
      const brand = await brandService.update(id, data);
      return sendSuccess(res, brand, 'Brand updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await brandService.delete(id);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
};

