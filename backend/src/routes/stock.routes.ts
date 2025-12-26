import { Router } from 'express';
import stockController from '../controllers/stock.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// IMPORTANT: More specific routes must come before parameterized routes
// to avoid route conflicts (e.g., /movements should come before /:productId/:warehouseId)
router.post('/check-availability', stockController.checkAvailability.bind(stockController));
router.post('/movements', stockController.createMovement.bind(stockController));
router.get('/movements', stockController.getMovements.bind(stockController));
router.get('/:productId/:warehouseId', stockController.getStock.bind(stockController));

export default router;

