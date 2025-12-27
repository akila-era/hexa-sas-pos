import { Router } from 'express';
import barcodeController from '../controllers/barcode.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// POST /api/v1/barcodes/generate - Generate barcodes for products
router.post('/generate', barcodeController.generateBarcodes);

// POST /api/v1/barcodes/qrcode - Generate QR codes for products
router.post('/qrcode', barcodeController.generateQRCodes);

// POST /api/v1/barcodes/single - Generate a single barcode
router.post('/single', barcodeController.generateSingleBarcode);

// GET /api/v1/barcodes/product/:productId - Generate barcode for a specific product
router.get('/product/:productId', barcodeController.generateProductBarcode);

// GET /api/v1/barcodes/auto-code - Generate auto code/SKU
router.get('/auto-code', barcodeController.generateAutoCode);

export default router;

