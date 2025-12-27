import { Response, NextFunction } from 'express';
import { AuthRequest, ApiResponse } from '../types';
import productService from '../services/product.service';
import { AppError as AppErrorClass } from '../middlewares/error.middleware';
import { transformProduct } from '../utils/transformers';

/**
 * Product Controller
 * 
 * Handles HTTP requests for Product CRUD operations.
 * All methods ensure tenant isolation through middleware.
 */
export class ProductController {
  /**
   * Create a new product
   * POST /api/products
   */
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new AppErrorClass('Tenant context is required', 403, 'TENANT_CONTEXT_REQUIRED');
      }

      const product = await productService.create(
        req.companyId!,
        req.body,
        req.user?.id
      );

      const response: ApiResponse = {
        success: true,
        data: product,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all products with pagination and filters
   * GET /api/products?page=1&limit=10&search=keyword&categoryId=1&brandId=1&isActive=true
   */
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new AppErrorClass('Tenant context is required', 403, 'TENANT_CONTEXT_REQUIRED');
      }

      const result = await productService.findAll(req.companyId!, req.query as any);

      // Transform data to match frontend format
      const transformedProducts = result.data.map(transformProduct);

      const response: ApiResponse = {
        success: true,
        data: transformedProducts,
        pagination: result.pagination,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single product by ID
   * GET /api/products/:id
   */
  async findOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new AppErrorClass('Tenant context is required', 403, 'TENANT_CONTEXT_REQUIRED');
      }

      const productId = req.params.id;
      if (!productId) {
        throw new AppErrorClass('Invalid product ID', 400, 'INVALID_PRODUCT_ID');
      }

      const product = await productService.findOne(req.companyId!, productId);

      const response: ApiResponse = {
        success: true,
        data: product,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a product
   * PUT /api/products/:id
   */
  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new AppErrorClass('Tenant context is required', 403, 'TENANT_CONTEXT_REQUIRED');
      }

      const productId = req.params.id;
      if (!productId) {
        throw new AppErrorClass('Invalid product ID', 400, 'INVALID_PRODUCT_ID');
      }

      const product = await productService.update(
        req.companyId!,
        productId,
        req.body
      );

      const response: ApiResponse = {
        success: true,
        data: product,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a product (soft delete)
   * DELETE /api/products/:id
   */
  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new AppErrorClass('Tenant context is required', 403, 'TENANT_CONTEXT_REQUIRED');
      }

      const productId = req.params.id;
      if (!productId) {
        throw new AppErrorClass('Invalid product ID', 400, 'INVALID_PRODUCT_ID');
      }

      const result = await productService.delete(req.companyId!, productId);

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Find product by barcode or SKU
   * GET /api/products/barcode/:barcode
   * Used for barcode scanning
   */
  async findByBarcode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.companyId) {
        throw new AppErrorClass('Tenant context is required', 403, 'TENANT_CONTEXT_REQUIRED');
      }

      const barcode = req.params.barcode || req.query.barcode as string;
      if (!barcode) {
        throw new AppErrorClass('Barcode is required', 400, 'BARCODE_REQUIRED');
      }

      const product = await productService.findByBarcode(req.companyId!, barcode);
      const transformedProduct = transformProduct(product);

      const response: ApiResponse = {
        success: true,
        data: transformedProduct,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();

