import { Request, Response, NextFunction } from 'express';
import variantAttributeService from '../services/variant-attribute.service';

export class VariantAttributeController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const result = await variantAttributeService.create(tenantId, req.body);
      res.status(201).json({
        success: true,
        data: result,
        message: 'Variant attribute created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { page, limit, sortBy, sortOrder, search, isActive } = req.query;
      
      const result = await variantAttributeService.findAll(tenantId, {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        search: search as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      });

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { id } = req.params;
      const result = await variantAttributeService.findOne(tenantId, id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { id } = req.params;
      const result = await variantAttributeService.update(tenantId, id, req.body);
      res.json({
        success: true,
        data: result,
        message: 'Variant attribute updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = (req as any).tenantId;
      const { id } = req.params;
      const result = await variantAttributeService.delete(tenantId, id);
      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new VariantAttributeController();

