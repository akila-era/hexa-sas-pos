import { Router } from 'express';
import variantController from '../controllers/variant.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// GET /api/v1/variants - Get all variants
router.get('/', variantController.findAll);

// GET /api/v1/variants/product/:productId - Get variants by product
router.get('/product/:productId', variantController.findByProduct);

// GET /api/v1/variants/:id - Get variant by ID
router.get('/:id', variantController.findOne);

// POST /api/v1/variants - Create variant
router.post('/', variantController.create);

// POST /api/v1/variants/bulk - Bulk create variants
router.post('/bulk', variantController.bulkCreate);

// PUT /api/v1/variants/:id - Update variant
router.put('/:id', variantController.update);

// DELETE /api/v1/variants/:id - Delete variant
router.delete('/:id', variantController.delete);

export default router;

