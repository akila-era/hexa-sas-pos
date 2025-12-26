import { Router } from 'express';
import saleController from '../controllers/sale.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation, branchAccess } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication, tenant isolation, and branch access
router.use(authenticate);
router.use(tenantIsolation);
router.use(branchAccess);

// Sale routes
router.post('/', saleController.create.bind(saleController));
router.get('/', saleController.findAll.bind(saleController));
router.get('/:id', saleController.findOne.bind(saleController));

export default router;

