import { Request, Response, NextFunction } from 'express';
import { unitService } from '../services/unit.service';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';
import { unitQuerySchema, createUnitSchema, updateUnitSchema } from '../validators/unit.validators';

export const unitController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = unitQuerySchema.parse(req.query);
      const { units, total, page, limit } = await unitService.findAll(query);
      return sendPaginated(res, units, total, page, limit, 'Units retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const unit = await unitService.findById(id);
      return sendSuccess(res, unit, 'Unit retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createUnitSchema.parse(req.body);
      const unit = await unitService.create(data);
      return sendCreated(res, unit, 'Unit created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = updateUnitSchema.parse(req.body);
      const unit = await unitService.update(id, data);
      return sendSuccess(res, unit, 'Unit updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await unitService.delete(id);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
};

