import { z } from 'zod';
import { BARCODE_TYPES } from '../utils/barcode';

export const generateBarcodeSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  type: z.enum([
    'code128',
    'code39',
    'ean13',
    'ean8',
    'upca',
    'upce',
    'itf14',
    'code93',
    'rationalizedCodabar',
  ]).optional().default('code128'),
  scale: z.number().min(1).max(10).optional().default(3),
  height: z.number().min(5).max(50).optional().default(10),
  includeText: z.boolean().optional().default(true),
});

export const generateQRCodeSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  width: z.number().min(50).max(1000).optional().default(200),
  margin: z.number().min(0).max(10).optional().default(2),
  darkColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#000000'),
  lightColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().default('#ffffff'),
  errorCorrectionLevel: z.enum(['L', 'M', 'Q', 'H']).optional().default('M'),
  format: z.enum(['png', 'dataUrl']).optional().default('png'),
});

export type GenerateBarcodeInput = z.infer<typeof generateBarcodeSchema>;
export type GenerateQRCodeInput = z.infer<typeof generateQRCodeSchema>;

