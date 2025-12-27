import { Request, Response, NextFunction } from 'express';
import { variantService } from '../services/variant.service';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';
import { variantQuerySchema, createVariantSchema, updateVariantSchema } from '../validators/variant.validators';

export const variantController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = variantQuerySchema.parse(req.query);
      const { variants, total, page, limit } = await variantService.findAll(query);
      return sendPaginated(res, variants, total, page, limit, 'Variants retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const variant = await variantService.findById(id);
      return sendSuccess(res, variant, 'Variant retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createVariantSchema.parse(req.body);
      const variant = await variantService.create(data);
      return sendCreated(res, variant, 'Variant created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = updateVariantSchema.parse(req.body);
      const variant = await variantService.update(id, data);
      return sendSuccess(res, variant, 'Variant updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await variantService.delete(id);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
};

