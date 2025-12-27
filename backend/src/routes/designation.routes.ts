import { Router } from 'express';
import designationController from '../controllers/designation.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', designationController.getAll.bind(designationController));
router.get('/:id', designationController.getById.bind(designationController));
router.post('/', designationController.create.bind(designationController));
router.put('/:id', designationController.update.bind(designationController));
router.delete('/:id', designationController.delete.bind(designationController));

export default router;

