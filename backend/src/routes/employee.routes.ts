import { Router } from 'express';
import employeeController from '../controllers/employee.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', employeeController.getAll.bind(employeeController));
router.get('/:id', employeeController.getById.bind(employeeController));
router.get('/:id/attendance-summary', employeeController.getAttendanceSummary.bind(employeeController));
router.post('/', employeeController.create.bind(employeeController));
router.put('/:id', employeeController.update.bind(employeeController));
router.delete('/:id', employeeController.delete.bind(employeeController));

export default router;

