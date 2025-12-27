import { Router } from 'express';
import supplierController from '../controllers/supplier.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', supplierController.getAll.bind(supplierController));
router.get('/:id', supplierController.getById.bind(supplierController));
router.get('/:id/balance', supplierController.getBalance.bind(supplierController));
router.post('/', supplierController.create.bind(supplierController));
router.put('/:id', supplierController.update.bind(supplierController));
router.delete('/:id', supplierController.delete.bind(supplierController));

export default router;

