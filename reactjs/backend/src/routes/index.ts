import { Router } from 'express';
import categoryRoutes from './category.routes';
import brandRoutes from './brand.routes';
import unitRoutes from './unit.routes';
import productRoutes from './product.routes';
import variantRoutes from './variant.routes';
import { barcodeController } from '../controllers/barcode.controller';

const router = Router();

// Products & Inventory Routes
router.use('/categories', categoryRoutes);
router.use('/brands', brandRoutes);
router.use('/units', unitRoutes);
router.use('/products', productRoutes);
router.use('/variants', variantRoutes);

// Barcode & QR Code endpoints (under /products as per plan)
router.post('/products/barcode', barcodeController.generateBarcode);
router.post('/products/qrcode', barcodeController.generateQRCode);
router.get('/products/barcode/types', barcodeController.getBarcodeTypes);

export default router;

