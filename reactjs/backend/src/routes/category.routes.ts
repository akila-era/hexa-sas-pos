import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';

const router = Router();

// GET /api/categories - Get all categories
router.get('/', categoryController.getAll);

// GET /api/categories/:id - Get single category
router.get('/:id', categoryController.getById);

// POST /api/categories - Create category
router.post('/', categoryController.create);

// PUT /api/categories/:id - Update category
router.put('/:id', categoryController.update);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', categoryController.delete);

export default router;

