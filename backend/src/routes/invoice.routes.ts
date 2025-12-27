import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// Invoice CRUD routes
router.get('/overdue', invoiceController.getOverdue.bind(invoiceController));
router.get('/', invoiceController.findAll.bind(invoiceController));
router.get('/:id', invoiceController.findOne.bind(invoiceController));
router.post('/', invoiceController.create.bind(invoiceController));
router.put('/:id', invoiceController.update.bind(invoiceController));
router.delete('/:id', invoiceController.delete.bind(invoiceController));

// Payment route
router.post('/:id/payment', invoiceController.addPayment.bind(invoiceController));

export default router;
