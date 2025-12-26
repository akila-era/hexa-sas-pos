import { Router } from 'express';
import { domainController } from '../../controllers/superadmin';

const router = Router();

// Domain routes
router.get('/stats', domainController.getStats.bind(domainController));
router.get('/', domainController.findAll.bind(domainController));
router.post('/', domainController.create.bind(domainController));
router.get('/:id', domainController.findOne.bind(domainController));
router.put('/:id/approve', domainController.approve.bind(domainController));
router.put('/:id/reject', domainController.reject.bind(domainController));
router.delete('/:id', domainController.delete.bind(domainController));

export default router;









