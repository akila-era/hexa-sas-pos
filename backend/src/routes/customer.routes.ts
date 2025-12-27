import { Router } from 'express';
import customerController from '../controllers/customer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', customerController.getAll.bind(customerController));
router.get('/:id', customerController.getById.bind(customerController));
router.get('/:id/balance', customerController.getBalance.bind(customerController));
router.get('/:id/sales', customerController.getSalesHistory.bind(customerController));
router.post('/', customerController.create.bind(customerController));
router.put('/:id', customerController.update.bind(customerController));
router.delete('/:id', customerController.delete.bind(customerController));

export default router;

