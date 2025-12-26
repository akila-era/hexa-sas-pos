import { Router } from 'express';
import posController from '../controllers/pos.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation, branchAccess } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication, tenant isolation, and branch access
router.use(authenticate);
router.use(tenantIsolation);
router.use(branchAccess);

// POS Order routes
router.post('/orders', posController.createOrder.bind(posController));
router.get('/orders', posController.getOrders.bind(posController));
router.get('/orders/:id', posController.getOrder.bind(posController));

export default router;

