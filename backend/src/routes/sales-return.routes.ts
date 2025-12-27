import { Router } from 'express';
import salesReturnController from '../controllers/sales-return.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// Sales Return CRUD routes
router.get('/', salesReturnController.findAll.bind(salesReturnController));
router.get('/:id', salesReturnController.findOne.bind(salesReturnController));
router.post('/', salesReturnController.create.bind(salesReturnController));
router.put('/:id', salesReturnController.update.bind(salesReturnController));
router.delete('/:id', salesReturnController.delete.bind(salesReturnController));

export default router;

