import { Router } from 'express';
import { variantController } from '../controllers/variant.controller';

const router = Router();

// GET /api/variants - Get all variants
router.get('/', variantController.getAll);

// GET /api/variants/:id - Get single variant
router.get('/:id', variantController.getById);

// POST /api/variants - Create variant
router.post('/', variantController.create);

// PUT /api/variants/:id - Update variant
router.put('/:id', variantController.update);

// DELETE /api/variants/:id - Delete variant
router.delete('/:id', variantController.delete);

export default router;

