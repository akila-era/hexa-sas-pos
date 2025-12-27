import { Router } from 'express';
import purchaseController from '../controllers/purchase.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', purchaseController.getAll.bind(purchaseController));
router.get('/:id', purchaseController.getById.bind(purchaseController));
router.post('/', purchaseController.create.bind(purchaseController));
router.post('/:id/payment', purchaseController.addPayment.bind(purchaseController));
router.put('/:id', purchaseController.update.bind(purchaseController));
router.delete('/:id', purchaseController.delete.bind(purchaseController));

export default router;

