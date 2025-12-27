import { Router } from 'express';
import payrollController from '../controllers/payroll.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', payrollController.getAll.bind(payrollController));
router.get('/summary', payrollController.getSummary.bind(payrollController));
router.get('/:id', payrollController.getById.bind(payrollController));
router.post('/generate', payrollController.generate.bind(payrollController));
router.put('/:id/process', payrollController.process.bind(payrollController));
router.put('/:id/pay', payrollController.markAsPaid.bind(payrollController));
router.put('/bulk-pay', payrollController.bulkMarkAsPaid.bind(payrollController));

export default router;

