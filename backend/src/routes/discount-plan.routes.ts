import { Router } from 'express';
import discountPlanController from '../controllers/discount-plan.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantIsolation);

router.get('/', discountPlanController.findAll.bind(discountPlanController));
router.get('/:id', discountPlanController.findOne.bind(discountPlanController));
router.post('/', discountPlanController.create.bind(discountPlanController));
router.put('/:id', discountPlanController.update.bind(discountPlanController));
router.delete('/:id', discountPlanController.delete.bind(discountPlanController));

export default router;

