import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { tenantSafe } from '../middlewares/tenant.middleware';

const router = Router();

// All routes require authentication and tenant safety
router.use(authenticate);
router.use(tenantSafe);

router.get('/sales/summary', reportController.getSalesSummary.bind(reportController));
router.get('/sales/top-products', reportController.getTopProducts.bind(reportController));
router.get('/sales/daily', reportController.getDailySales.bind(reportController));
router.get('/inventory/summary', reportController.getInventorySummary.bind(reportController));

export default router;







