import { Router } from 'express';
import stockController from '../controllers/stock.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// =====================
// STOCK ADJUSTMENTS
// =====================
router.get('/adjustments', stockController.getAllAdjustments.bind(stockController));
router.post('/adjustments', stockController.createAdjustment.bind(stockController));

// =====================
// STOCK TRANSFERS
// =====================
router.get('/transfers', stockController.getAllTransfers.bind(stockController));
router.get('/transfers/:id', stockController.getTransferById.bind(stockController));
router.post('/transfers', stockController.createTransfer.bind(stockController));
router.delete('/transfers/:id', stockController.deleteTransfer.bind(stockController));

// =====================
// STOCK MOVEMENTS
// =====================
router.get('/movements', stockController.getMovements.bind(stockController));
router.post('/movements', stockController.createMovement.bind(stockController));

// =====================
// AVAILABILITY CHECK
// =====================
router.post('/check-availability', stockController.checkAvailability.bind(stockController));

// =====================
// MANAGE STOCK (Base routes)
// =====================
router.get('/', stockController.getAll.bind(stockController));
router.post('/', stockController.addStock.bind(stockController));
router.put('/:id', stockController.updateStock.bind(stockController));

// Get specific product/warehouse stock (must be last due to params)
router.get('/:productId/:warehouseId', stockController.getStock.bind(stockController));

export default router;
