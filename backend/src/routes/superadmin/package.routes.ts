import { Router } from 'express';
import { packageController } from '../../controllers/superadmin';

const router = Router();

// Package routes
router.get('/stats', packageController.getStats.bind(packageController));
router.get('/', packageController.findAll.bind(packageController));
router.post('/', packageController.create.bind(packageController));
router.get('/:id', packageController.findOne.bind(packageController));
router.put('/:id', packageController.update.bind(packageController));
router.delete('/:id', packageController.delete.bind(packageController));

export default router;









