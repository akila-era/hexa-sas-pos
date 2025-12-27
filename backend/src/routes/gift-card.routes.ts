import { Router } from 'express';
import giftCardController from '../controllers/gift-card.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantIsolation);

router.get('/', giftCardController.findAll.bind(giftCardController));
router.get('/:id', giftCardController.findOne.bind(giftCardController));
router.post('/', giftCardController.create.bind(giftCardController));
router.put('/:id', giftCardController.update.bind(giftCardController));
router.delete('/:id', giftCardController.delete.bind(giftCardController));
router.post('/:id/redeem', giftCardController.redeem.bind(giftCardController));

export default router;

