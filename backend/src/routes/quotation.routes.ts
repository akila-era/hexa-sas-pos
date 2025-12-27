import { Router } from 'express';
import quotationController from '../controllers/quotation.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// Quotation CRUD routes
router.get('/', quotationController.findAll.bind(quotationController));
router.get('/:id', quotationController.findOne.bind(quotationController));
router.post('/', quotationController.create.bind(quotationController));
router.put('/:id', quotationController.update.bind(quotationController));
router.delete('/:id', quotationController.delete.bind(quotationController));

// Status and conversion routes
router.put('/:id/status', quotationController.updateStatus.bind(quotationController));
router.post('/:id/convert', quotationController.convertToSale.bind(quotationController));

export default router;
