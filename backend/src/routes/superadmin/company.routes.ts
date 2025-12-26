import { Router } from 'express';
import { companyController } from '../../controllers/superadmin';

const router = Router();

// Company routes
router.get('/stats', companyController.getStats.bind(companyController));
router.get('/', companyController.findAll.bind(companyController));
router.post('/', companyController.create.bind(companyController));
router.get('/:id', companyController.findOne.bind(companyController));
router.put('/:id', companyController.update.bind(companyController));
router.delete('/:id', companyController.delete.bind(companyController));
router.put('/:id/upgrade', companyController.upgradePlan.bind(companyController));
router.put('/:id/toggle-status', companyController.toggleStatus.bind(companyController));

export default router;









