import { Router } from 'express';
import companyController from '../controllers/company.controller';
import branchController from '../controllers/branch.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantSafe } from '../middlewares/tenant.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

// Company routes (public for registration, protected for management)
router.post('/', companyController.create.bind(companyController)); // Public - for registration
router.get('/', authenticate, tenantSafe, companyController.findAll.bind(companyController));
router.get('/:id', authenticate, tenantSafe, companyController.findOne.bind(companyController));
router.put('/:id', authenticate, tenantSafe, companyController.update.bind(companyController));

// Branch routes (require authentication and tenant safety)
router.post('/branches', authenticate, tenantSafe, branchController.create.bind(branchController));
router.get('/branches', authenticate, tenantSafe, branchController.findAll.bind(branchController));
router.get('/branches/:id', authenticate, tenantSafe, branchController.findOne.bind(branchController));
router.put('/branches/:id', authenticate, tenantSafe, branchController.update.bind(branchController));

export default router;

