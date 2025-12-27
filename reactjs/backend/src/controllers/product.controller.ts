import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response';
import {
  productQuerySchema,
  createProductSchema,
  updateProductSchema,
  lowStockQuerySchema,
  expiredProductsQuerySchema,
} from '../validators/product.validators';

export const productController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query = productQuerySchema.parse(req.query);
      const { products, total, page, limit } = await productService.findAll(query);
      return sendPaginated(res, products, total, page, limit, 'Products retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const product = await productService.findById(id);
      return sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const data = createProductSchema.parse(req.body);
      const product = await productService.create(data);
      return sendCreated(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const data = updateProductSchema.parse(req.body);
      const product = await productService.update(id, data);
      return sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await productService.delete(id);
      return sendNoContent(res);
    } catch (error) {
      next(error);
    }
  },

  async getLowStock(req: Request, res: Response, next: NextFunction) {
    try {
      const query = lowStockQuerySchema.parse(req.query);
      const { products, total, page, limit } = await productService.getLowStock(query);
      return sendPaginated(res, products, total, page, limit, 'Low stock products retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getExpired(req: Request, res: Response, next: NextFunction) {
    try {
      const query = expiredProductsQuerySchema.parse(req.query);
      const { products, total, page, limit } = await productService.getExpired(query);
      return sendPaginated(res, products, total, page, limit, 'Expired products retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};

