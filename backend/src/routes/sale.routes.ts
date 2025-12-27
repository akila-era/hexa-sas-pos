import { Router } from 'express';
import saleController from '../controllers/sale.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// Sale CRUD routes
router.get('/', saleController.findAll.bind(saleController));
router.get('/:id', saleController.findOne.bind(saleController));
router.post('/', saleController.create.bind(saleController));
router.put('/:id', saleController.update.bind(saleController));
router.delete('/:id', saleController.delete.bind(saleController));

// Payment routes
router.get('/:id/payments', saleController.getPayments.bind(saleController));
router.post('/:id/payments', saleController.createPayment.bind(saleController));
router.put('/:id/payments/:paymentId', saleController.updatePayment.bind(saleController));
router.delete('/:id/payments/:paymentId', saleController.deletePayment.bind(saleController));

export default router;
