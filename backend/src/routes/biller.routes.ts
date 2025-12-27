import { Router } from 'express';
import billerController from '../controllers/biller.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';

const router = Router();

router.use(authenticate);
router.use(tenantIsolation);

router.get('/', billerController.findAll.bind(billerController));
router.get('/:id', billerController.findOne.bind(billerController));
router.post('/', billerController.create.bind(billerController));
router.put('/:id', billerController.update.bind(billerController));
router.delete('/:id', billerController.delete.bind(billerController));

export default router;

