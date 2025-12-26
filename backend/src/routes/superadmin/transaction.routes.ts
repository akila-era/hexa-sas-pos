import { Router } from 'express';
import { transactionController } from '../../controllers/superadmin';

const router = Router();

// Transaction routes
router.get('/stats', transactionController.getStats.bind(transactionController));
router.get('/generate-invoice-id', transactionController.generateInvoiceId.bind(transactionController));
router.get('/invoice/:invoiceId', transactionController.findByInvoice.bind(transactionController));
router.get('/', transactionController.findAll.bind(transactionController));
router.post('/', transactionController.create.bind(transactionController));
router.get('/:id', transactionController.findOne.bind(transactionController));
router.put('/:id/status', transactionController.updateStatus.bind(transactionController));
router.delete('/:id', transactionController.delete.bind(transactionController));

export default router;









