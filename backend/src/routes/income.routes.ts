import { Router } from 'express';
import incomeController from '../controllers/income.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Incomes
router.get('/', incomeController.getAll.bind(incomeController));
router.get('/summary', incomeController.getSummary.bind(incomeController));
router.get('/by-category', incomeController.getByCategory.bind(incomeController));
router.get('/:id', incomeController.getById.bind(incomeController));
router.post('/', incomeController.create.bind(incomeController));
router.put('/:id', incomeController.update.bind(incomeController));
router.delete('/:id', incomeController.delete.bind(incomeController));

// Income Categories
router.get('/categories/list', incomeController.getCategories.bind(incomeController));
router.post('/categories', incomeController.createCategory.bind(incomeController));
router.put('/categories/:id', incomeController.updateCategory.bind(incomeController));
router.delete('/categories/:id', incomeController.deleteCategory.bind(incomeController));

export default router;

