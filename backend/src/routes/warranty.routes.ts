import { Router } from 'express';
import warrantyController from '../controllers/warranty.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantMiddleware } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantMiddleware);

// GET /api/v1/warranties - Get all warranties
router.get('/', warrantyController.findAll);

// GET /api/v1/warranties/:id - Get warranty by ID
router.get('/:id', warrantyController.findOne);

// POST /api/v1/warranties - Create warranty
router.post('/', warrantyController.create);

// PUT /api/v1/warranties/:id - Update warranty
router.put('/:id', warrantyController.update);

// DELETE /api/v1/warranties/:id - Delete warranty
router.delete('/:id', warrantyController.delete);

export default router;

