import { Request, Response, NextFunction } from 'express';
import barcodeService from '../services/barcode.service';
import { AuthRequest } from '../types';

export class BarcodeController {
  async generateBarcodes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const result = await barcodeService.generateBarcodes(tenantId, req.body);
      
      res.json({
        success: true,
        data: result,
        message: 'Barcodes generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async generateQRCodes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const result = await barcodeService.generateQRCodes(tenantId, req.body);
      
      res.json({
        success: true,
        data: result,
        message: 'QR codes generated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async generateSingleBarcode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await barcodeService.generateSingleBarcode(req.body);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateProductBarcode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const result = await barcodeService.generateProductBarcode(tenantId, req.params.productId);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async generateAutoCode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
      }

      const prefix = req.query.prefix as string || 'PRD';
      const result = await barcodeService.generateAutoCode(tenantId, prefix);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new BarcodeController();

