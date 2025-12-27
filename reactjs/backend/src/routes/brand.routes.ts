import { Router } from 'express';
import { brandController } from '../controllers/brand.controller';

const router = Router();

// GET /api/brands - Get all brands
router.get('/', brandController.getAll);

// GET /api/brands/:id - Get single brand
router.get('/:id', brandController.getById);

// POST /api/brands - Create brand
router.post('/', brandController.create);

// PUT /api/brands/:id - Update brand
router.put('/:id', brandController.update);

// DELETE /api/brands/:id - Delete brand
router.delete('/:id', brandController.delete);

export default router;

