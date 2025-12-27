import { Router } from 'express';
import leaveTypeController from '../controllers/leave-type.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', leaveTypeController.getAll.bind(leaveTypeController));
router.get('/:id', leaveTypeController.getById.bind(leaveTypeController));
router.post('/', leaveTypeController.create.bind(leaveTypeController));
router.put('/:id', leaveTypeController.update.bind(leaveTypeController));
router.delete('/:id', leaveTypeController.delete.bind(leaveTypeController));

export default router;

