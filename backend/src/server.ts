import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error.middleware';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5557;

// Middlewares
app.use(helmet()); // Security headers
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3002',
      'http://localhost:3006',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development
    }
  },
  credentials: true
}));
app.use(morgan('dev')); // HTTP request logger
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint (no versioning)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'HEXA SAS POS Backend Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API v1 health check
app.get('/api/v1/health', (req, res) => {
  res.json({
    success: true,
    message: 'HEXA SAS POS Backend Server is running!',
    version: 'v1',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API v1 base endpoint
app.get('/api/v1', (req, res) => {
  res.json({
    success: true,
    message: 'HEXA SAS POS Backend API v1',
    version: 'v1',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      companies: '/api/v1/companies',
      // Products & Inventory
      products: '/api/v1/products',
      brands: '/api/v1/brands',
      units: '/api/v1/units',
      categories: '/api/v1/categories',
      variants: '/api/v1/variants',
      variantAttributes: '/api/v1/variant-attributes',
      warranties: '/api/v1/warranties',
      barcodes: '/api/v1/barcodes',
      // Sales
      pos: '/api/v1/pos',
      sales: '/api/v1/sales',
      onlineOrders: '/api/v1/online-orders',
      salesReturns: '/api/v1/sales-returns',
      quotations: '/api/v1/quotations',
      invoices: '/api/v1/invoices',
      // Stock
      stock: '/api/v1/stock',
      // Purchases
      purchases: '/api/v1/purchases',
      suppliers: '/api/v1/suppliers',
      // Customers
      customers: '/api/v1/customers',
      billers: '/api/v1/billers',
      // HRM
      employees: '/api/v1/employees',
      departments: '/api/v1/departments',
      designations: '/api/v1/designations',
      shifts: '/api/v1/shifts',
      attendance: '/api/v1/attendance',
      leaves: '/api/v1/leaves',
      leaveTypes: '/api/v1/leave-types',
      holidays: '/api/v1/holidays',
      payroll: '/api/v1/payroll',
      // Finance
      accounts: '/api/v1/accounts',
      expenses: '/api/v1/expenses',
      income: '/api/v1/income',
      moneyTransfer: '/api/v1/money-transfer',
      // Promo
      coupons: '/api/v1/coupons',
      giftCards: '/api/v1/gift-cards',
      discountPlans: '/api/v1/discount-plans',
      discounts: '/api/v1/discounts',
      // Settings & Reports
      settings: '/api/v1/settings',
      reports: '/api/v1/reports',
      // OMS (Order Management System)
      oms: '/api/v1/oms',
      // Super Admin
      superAdmin: {
        dashboard: '/api/v1/super-admin/dashboard',
        companies: '/api/v1/super-admin/companies',
        packages: '/api/v1/super-admin/packages',
        subscriptions: '/api/v1/super-admin/subscriptions',
        domains: '/api/v1/super-admin/domains',
        transactions: '/api/v1/super-admin/transactions',
        features: '/api/v1/super-admin/features'
      }
    }
  });
});

// API Routes - Core
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';

// API Routes - Products & Inventory
import productRoutes from './routes/product.routes';
import brandRoutes from './routes/brand.routes';
import unitRoutes from './routes/unit.routes';
import categoryRoutes from './routes/category.routes';
import variantRoutes from './routes/variant.routes';
import variantAttributeRoutes from './routes/variant-attribute.routes';
import warrantyRoutes from './routes/warranty.routes';
import barcodeRoutes from './routes/barcode.routes';

// API Routes - Sales & POS
import posRoutes from './routes/pos.routes';
import saleRoutes from './routes/sale.routes';
import onlineOrderRoutes from './routes/online-order.routes';
import salesReturnRoutes from './routes/sales-return.routes';
import quotationRoutes from './routes/quotation.routes';
import invoiceRoutes from './routes/invoice.routes';

// API Routes - Stock
import stockRoutes from './routes/stock.routes';

// API Routes - Purchases
import purchaseRoutes from './routes/purchase.routes';
import purchaseReturnRoutes from './routes/purchase-return.routes';
import supplierRoutes from './routes/supplier.routes';

// API Routes - Customers
import customerRoutes from './routes/customer.routes';
import billerRoutes from './routes/biller.routes';

// API Routes - HRM
import employeeRoutes from './routes/employee.routes';
import departmentRoutes from './routes/department.routes';
import designationRoutes from './routes/designation.routes';
import shiftRoutes from './routes/shift.routes';
import attendanceRoutes from './routes/attendance.routes';
import leaveRoutes from './routes/leave.routes';
import leaveTypeRoutes from './routes/leave-type.routes';
import holidayRoutes from './routes/holiday.routes';
import payrollRoutes from './routes/payroll.routes';

// API Routes - Finance
import accountRoutes from './routes/account.routes';
import expenseRoutes from './routes/expense.routes';
import incomeRoutes from './routes/income.routes';
import moneyTransferRoutes from './routes/money-transfer.routes';

// API Routes - Promo
import couponRoutes from './routes/coupon.routes';
import giftCardRoutes from './routes/gift-card.routes';
import discountPlanRoutes from './routes/discount-plan.routes';
import discountRoutes from './routes/discount.routes';

// API Routes - Settings & Reports
import settingsRoutes from './routes/settings.routes';
import reportRoutes from './routes/report.routes';

// API Routes - OMS (Order Management System)
import omsRoutes from './routes/oms.routes';

// API Routes - Super Admin
import superAdminRoutes from './routes/superadmin';

// API v1 routes - Core
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);

// API v1 routes - Products & Inventory
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/brands', brandRoutes);
app.use('/api/v1/units', unitRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/variants', variantRoutes);
app.use('/api/v1/variant-attributes', variantAttributeRoutes);
app.use('/api/v1/warranties', warrantyRoutes);
app.use('/api/v1/barcodes', barcodeRoutes);

// API v1 routes - Sales & POS
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/online-orders', onlineOrderRoutes);
app.use('/api/v1/sales-returns', salesReturnRoutes);
app.use('/api/v1/quotations', quotationRoutes);
app.use('/api/v1/invoices', invoiceRoutes);

// API v1 routes - Stock
app.use('/api/v1/stock', stockRoutes);

// API v1 routes - Purchases
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/purchase-returns', purchaseReturnRoutes);
app.use('/api/v1/suppliers', supplierRoutes);

// API v1 routes - Customers
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/billers', billerRoutes);

// API v1 routes - HRM
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/designations', designationRoutes);
app.use('/api/v1/shifts', shiftRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/leave-types', leaveTypeRoutes);
app.use('/api/v1/holidays', holidayRoutes);
app.use('/api/v1/payroll', payrollRoutes);

// API v1 routes - Finance
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/expenses', expenseRoutes);
app.use('/api/v1/income', incomeRoutes);
app.use('/api/v1/money-transfer', moneyTransferRoutes);

// API v1 routes - Promo
app.use('/api/v1/coupons', couponRoutes);
app.use('/api/v1/gift-cards', giftCardRoutes);
app.use('/api/v1/discount-plans', discountPlanRoutes);
app.use('/api/v1/discounts', discountRoutes);

// API v1 routes - Settings & Reports
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/reports', reportRoutes);

// API v1 routes - OMS (Order Management System)
app.use('/api/v1/oms', omsRoutes);

// Super Admin routes
app.use('/api/v1/super-admin', superAdminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`🔗 API v1: http://localhost:${PORT}/api/v1`);
});

export default app;
