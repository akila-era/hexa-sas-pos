import { Request, Response, NextFunction } from 'express';
import { generateBarcode, BARCODE_TYPES } from '../utils/barcode';
import { generateQRCode, generateQRCodeDataURL } from '../utils/qrcode';
import { generateBarcodeSchema, generateQRCodeSchema } from '../validators/barcode.validators';
import { sendSuccess } from '../utils/response';

export const barcodeController = {
  async generateBarcode(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateBarcodeSchema.parse(req.body);

      const buffer = await generateBarcode({
        text: data.text,
        type: data.type,
        scale: data.scale,
        height: data.height,
        includeText: data.includeText,
      });

      // Set headers for image response
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="barcode-${data.text}.png"`);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  },

  async generateQRCode(req: Request, res: Response, next: NextFunction) {
    try {
      const data = generateQRCodeSchema.parse(req.body);

      if (data.format === 'dataUrl') {
        const dataUrl = await generateQRCodeDataURL({
          text: data.text,
          width: data.width,
          margin: data.margin,
          color: { dark: data.darkColor, light: data.lightColor },
          errorCorrectionLevel: data.errorCorrectionLevel,
        });

        return sendSuccess(res, { dataUrl }, 'QR code generated successfully');
      }

      const buffer = await generateQRCode({
        text: data.text,
        width: data.width,
        margin: data.margin,
        color: { dark: data.darkColor, light: data.lightColor },
        errorCorrectionLevel: data.errorCorrectionLevel,
      });

      // Set headers for image response
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="qrcode.png"`);
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  },

  async getBarcodeTypes(req: Request, res: Response, next: NextFunction) {
    try {
      const types = Object.entries(BARCODE_TYPES).map(([name, code]) => ({
        name,
        code,
      }));
      return sendSuccess(res, types, 'Barcode types retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
};

