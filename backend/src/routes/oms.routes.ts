import { Router } from 'express';
import omsController from '../controllers/oms.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';
import { featureGuard } from '../middlewares/feature.middleware';

const router = Router();

// All OMS routes require authentication, tenant isolation, and OMS feature enabled
router.use(authenticate);
router.use(tenantIsolation);
router.use(featureGuard('OMS'));

// Order routes
router.get('/orders', omsController.findAll.bind(omsController));
router.get('/orders/:id', omsController.findOne.bind(omsController));
router.post('/orders', omsController.create.bind(omsController));
router.put('/orders/:id', omsController.update.bind(omsController));
router.delete('/orders/:id', omsController.delete.bind(omsController));
router.post('/orders/:id/payment', omsController.addPayment.bind(omsController));

// Statistics
router.get('/stats', omsController.getStats.bind(omsController));

export default router;

