import { Router } from 'express';
import onlineOrderController from '../controllers/online-order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// Online Order CRUD routes
router.get('/', onlineOrderController.findAll.bind(onlineOrderController));
router.get('/:id', onlineOrderController.findOne.bind(onlineOrderController));
router.post('/', onlineOrderController.create.bind(onlineOrderController));
router.put('/:id', onlineOrderController.update.bind(onlineOrderController));
router.delete('/:id', onlineOrderController.delete.bind(onlineOrderController));

// Payment routes
router.get('/:id/payments', onlineOrderController.getPayments.bind(onlineOrderController));
router.post('/:id/payments', onlineOrderController.createPayment.bind(onlineOrderController));
router.put('/:id/payments/:paymentId', onlineOrderController.updatePayment.bind(onlineOrderController));
router.delete('/:id/payments/:paymentId', onlineOrderController.deletePayment.bind(onlineOrderController));

export default router;

