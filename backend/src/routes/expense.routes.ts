import { Router } from 'express';
import expenseController from '../controllers/expense.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

// Expenses
router.get('/', expenseController.getAll.bind(expenseController));
router.get('/summary', expenseController.getSummary.bind(expenseController));
router.get('/by-category', expenseController.getByCategory.bind(expenseController));
router.get('/:id', expenseController.getById.bind(expenseController));
router.post('/', expenseController.create.bind(expenseController));
router.put('/:id', expenseController.update.bind(expenseController));
router.delete('/:id', expenseController.delete.bind(expenseController));

// Expense Categories
router.get('/categories/list', expenseController.getCategories.bind(expenseController));
router.post('/categories', expenseController.createCategory.bind(expenseController));
router.put('/categories/:id', expenseController.updateCategory.bind(expenseController));
router.delete('/categories/:id', expenseController.deleteCategory.bind(expenseController));

export default router;

