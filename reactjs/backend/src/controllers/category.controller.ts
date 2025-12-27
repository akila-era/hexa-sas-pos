import { Request, Response, NextFunction } from 'express';
import { categoryService } from '../services/category.service';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';
import { categoryQuerySchema, createCategorySchema, updateCategorySchema } from '../validators/category.validators';

export const categoryController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = categoryQuerySchema.parse(req.query);
      const { categories, total, page, limit } = await categoryService.findAll(query);
      return sendPaginated(res, categories, total, page, limit, 'Categories retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await categoryService.findById(id);
      return sendSuccess(res, category, 'Category retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createCategorySchema.parse(req.body);
      const category = await categoryService.create(data);
      return sendCreated(res, category, 'Category created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = updateCategorySchema.parse(req.body);
      const category = await categoryService.update(id, data);
      return sendSuccess(res, category, 'Category updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await categoryService.delete(id);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },
};

