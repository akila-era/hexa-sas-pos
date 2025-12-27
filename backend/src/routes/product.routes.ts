import { Router } from 'express';
import productController from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantIsolation } from '../middlewares/tenant.middleware';
import { requirePermission } from '../middlewares/rbac.middleware';

const router = Router();

// All routes require authentication and tenant isolation
router.use(authenticate);
router.use(tenantIsolation);

// Product CRUD routes with RBAC
router.post(
  '/',
  requirePermission('products:create'),
  productController.create.bind(productController)
);

router.get(
  '/',
  requirePermission('products:read'),
  productController.findAll.bind(productController)
);

// Barcode search route (before :id route to avoid conflict)
router.get(
  '/barcode/:barcode',
  requirePermission('products:read'),
  productController.findByBarcode.bind(productController)
);

router.get(
  '/:id',
  requirePermission('products:read'),
  productController.findOne.bind(productController)
);

router.put(
  '/:id',
  requirePermission('products:update'),
  productController.update.bind(productController)
);

router.delete(
  '/:id',
  requirePermission('products:delete'),
  productController.delete.bind(productController)
);

export default router;

