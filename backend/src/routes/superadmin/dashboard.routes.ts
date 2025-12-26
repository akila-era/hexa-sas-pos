import { Router } from 'express';
import { dashboardController } from '../../controllers/superadmin';

const router = Router();

// Dashboard routes
router.get('/stats', dashboardController.getStats.bind(dashboardController));
router.get('/revenue', dashboardController.getRevenueData.bind(dashboardController));
router.get('/recent-transactions', dashboardController.getRecentTransactions.bind(dashboardController));
router.get('/recent-registered', dashboardController.getRecentlyRegistered.bind(dashboardController));
router.get('/expired-plans', dashboardController.getExpiredPlans.bind(dashboardController));
router.get('/company-chart', dashboardController.getCompanyChartData.bind(dashboardController));
router.get('/plan-distribution', dashboardController.getPlanDistribution.bind(dashboardController));

export default router;









