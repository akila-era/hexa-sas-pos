import { Router } from 'express';
import { productController } from '../controllers/product.controller';

const router = Router();

// GET /api/products/low-stock - Get low stock products (before :id to avoid conflict)
router.get('/low-stock', productController.getLowStock);

// GET /api/products/expired - Get expired products
router.get('/expired', productController.getExpired);

// GET /api/products - Get all products
router.get('/', productController.getAll);

// GET /api/products/:id - Get single product
router.get('/:id', productController.getById);

// POST /api/products - Create product
router.post('/', productController.create);

// PUT /api/products/:id - Update product
router.put('/:id', productController.update);

// DELETE /api/products/:id - Delete product
router.delete('/:id', productController.delete);

export default router;

