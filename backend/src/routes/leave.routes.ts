import { Router } from 'express';
import leaveController from '../controllers/leave.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', leaveController.getAll.bind(leaveController));
router.get('/:id', leaveController.getById.bind(leaveController));
router.get('/balance/:employeeId', leaveController.getBalance.bind(leaveController));
router.post('/', leaveController.create.bind(leaveController));
router.put('/:id/approve', leaveController.approve.bind(leaveController));
router.put('/:id/reject', leaveController.reject.bind(leaveController));
router.put('/:id/cancel', leaveController.cancel.bind(leaveController));

export default router;

