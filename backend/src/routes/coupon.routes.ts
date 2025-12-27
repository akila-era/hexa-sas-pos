import { Router } from 'express';
import couponController from '../controllers/coupon.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantIsolation);

router.get('/', couponController.findAll.bind(couponController));
router.get('/:id', couponController.findOne.bind(couponController));
router.post('/', couponController.create.bind(couponController));
router.put('/:id', couponController.update.bind(couponController));
router.delete('/:id', couponController.delete.bind(couponController));
router.post('/validate', couponController.validateCode.bind(couponController));

export default router;

