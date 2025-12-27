import { Router } from 'express';
import purchaseReturnController from '../controllers/purchase-return.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', purchaseReturnController.findAll.bind(purchaseReturnController));
router.get('/:id', purchaseReturnController.findOne.bind(purchaseReturnController));
router.post('/', purchaseReturnController.create.bind(purchaseReturnController));
router.put('/:id', purchaseReturnController.update.bind(purchaseReturnController));
router.delete('/:id', purchaseReturnController.delete.bind(purchaseReturnController));

export default router;

