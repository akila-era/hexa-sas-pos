import { Router } from 'express';
import { unitController } from '../controllers/unit.controller';

const router = Router();

// GET /api/units - Get all units
router.get('/', unitController.getAll);

// GET /api/units/:id - Get single unit
router.get('/:id', unitController.getById);

// POST /api/units - Create unit
router.post('/', unitController.create);

// PUT /api/units/:id - Update unit
router.put('/:id', unitController.update);

// DELETE /api/units/:id - Delete unit
router.delete('/:id', unitController.delete);

export default router;

