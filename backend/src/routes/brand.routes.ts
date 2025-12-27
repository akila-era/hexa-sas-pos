import { Router } from 'express';
import brandController from '../controllers/brand.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', brandController.getAll.bind(brandController));
router.get('/:id', brandController.getById.bind(brandController));
router.post('/', brandController.create.bind(brandController));
router.put('/:id', brandController.update.bind(brandController));
router.delete('/:id', brandController.delete.bind(brandController));

export default router;

