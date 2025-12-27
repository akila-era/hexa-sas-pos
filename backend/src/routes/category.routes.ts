import { Router } from 'express';
import categoryController from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// GET /api/v1/categories/tree - Get category tree (hierarchical)
router.get('/tree', categoryController.getTree);

// GET /api/v1/categories - Get all categories
router.get('/', categoryController.findAll);

// GET /api/v1/categories/:id - Get category by ID
router.get('/:id', categoryController.findOne);

// POST /api/v1/categories - Create category
router.post('/', categoryController.create);

// PUT /api/v1/categories/:id - Update category
router.put('/:id', categoryController.update);

// DELETE /api/v1/categories/:id - Delete category
router.delete('/:id', categoryController.delete);

export default router;

