import { Router } from 'express';
import moneyTransferController from '../controllers/money-transfer.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', moneyTransferController.getAll.bind(moneyTransferController));
router.get('/:id', moneyTransferController.getById.bind(moneyTransferController));
router.post('/', moneyTransferController.create.bind(moneyTransferController));
router.delete('/:id', moneyTransferController.delete.bind(moneyTransferController));

export default router;

