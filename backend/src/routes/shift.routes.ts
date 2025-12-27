import { Router } from 'express';
import shiftController from '../controllers/shift.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', shiftController.getAll.bind(shiftController));
router.get('/:id', shiftController.getById.bind(shiftController));
router.post('/', shiftController.create.bind(shiftController));
router.put('/:id', shiftController.update.bind(shiftController));
router.delete('/:id', shiftController.delete.bind(shiftController));

export default router;

