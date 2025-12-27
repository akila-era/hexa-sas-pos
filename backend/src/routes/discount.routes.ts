import { Router } from 'express';
import discountController from '../controllers/discount.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantIsolation);

router.get('/', discountController.findAll.bind(discountController));
router.get('/:id', discountController.findOne.bind(discountController));
router.post('/', discountController.create.bind(discountController));
router.put('/:id', discountController.update.bind(discountController));
router.delete('/:id', discountController.delete.bind(discountController));

export default router;

