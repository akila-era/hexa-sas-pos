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
router.get('/purchases', reportController.getPurchaseReport.bind(reportController));
router.get('/purchase-orders', reportController.getPurchaseOrderReport.bind(reportController));
router.get('/balance-sheet', reportController.getBalanceSheet.bind(reportController));
router.get('/trial-balance', reportController.getTrialBalance.bind(reportController));
router.get('/cash-flow', reportController.getCashFlow.bind(reportController));
router.get('/invoices', reportController.getInvoiceReport.bind(reportController));
router.get('/stock-history', reportController.getStockHistory.bind(reportController));
router.get('/sold-stock', reportController.getSoldStock.bind(reportController));
router.get('/suppliers', reportController.getSupplierReport.bind(reportController));
router.get('/supplier-due', reportController.getSupplierDueReport.bind(reportController));
router.get('/customers', reportController.getCustomerReport.bind(reportController));
router.get('/customer-due', reportController.getCustomerDueReport.bind(reportController));
router.get('/products', reportController.getProductReport.bind(reportController));
router.get('/products/expired', reportController.getProductExpiryReport.bind(reportController));
router.get('/products/quantity-alert', reportController.getProductQuantityAlert.bind(reportController));
router.get('/expenses', reportController.getExpenseReport.bind(reportController));
router.get('/income', reportController.getIncomeReport.bind(reportController));
router.get('/tax/purchase', reportController.getPurchaseTaxReport.bind(reportController));
router.get('/tax/sales', reportController.getSalesTaxReport.bind(reportController));
router.get('/profit-loss', reportController.getProfitLossReport.bind(reportController));
router.get('/annual', reportController.getAnnualReport.bind(reportController));

export default router;








