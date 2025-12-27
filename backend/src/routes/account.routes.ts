import { Router } from 'express';
import accountController from '../controllers/account.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', accountController.getAll.bind(accountController));
router.get('/chart', accountController.getChartOfAccounts.bind(accountController));
router.get('/:id', accountController.getById.bind(accountController));
router.get('/:id/statement', accountController.getStatement.bind(accountController));
router.post('/', accountController.create.bind(accountController));
router.post('/initialize', accountController.initializeDefaults.bind(accountController));
router.put('/:id', accountController.update.bind(accountController));
router.delete('/:id', accountController.delete.bind(accountController));

export default router;

