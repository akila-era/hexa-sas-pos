import { Router } from 'express';
import variantAttributeController from '../controllers/variant-attribute.controller';

const router = Router();

// GET /api/variant-attributes - Get all variant attributes
router.get('/', variantAttributeController.findAll);

// GET /api/variant-attributes/:id - Get single variant attribute
router.get('/:id', variantAttributeController.findOne);

// POST /api/variant-attributes - Create new variant attribute
router.post('/', variantAttributeController.create);

// PUT /api/variant-attributes/:id - Update variant attribute
router.put('/:id', variantAttributeController.update);

// DELETE /api/variant-attributes/:id - Delete variant attribute
router.delete('/:id', variantAttributeController.delete);

export default router;

