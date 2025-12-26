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
      products: '/api/v1/products',
      pos: '/api/v1/pos',
      sales: '/api/v1/sales',
      stock: '/api/v1/stock',
      reports: '/api/v1/reports',
      superAdmin: {
        dashboard: '/api/v1/super-admin/dashboard',
        companies: '/api/v1/super-admin/companies',
        packages: '/api/v1/super-admin/packages',
        subscriptions: '/api/v1/super-admin/subscriptions',
        domains: '/api/v1/super-admin/domains',
        transactions: '/api/v1/super-admin/transactions'
      }
    }
  });
});

// API Routes
import authRoutes from './routes/auth.routes';
import companyRoutes from './routes/company.routes';
import productRoutes from './routes/product.routes';
import posRoutes from './routes/pos.routes';
import saleRoutes from './routes/sale.routes';
import stockRoutes from './routes/stock.routes';
import reportRoutes from './routes/report.routes';
import superAdminRoutes from './routes/superadmin';

// API v1 routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/pos', posRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/stock', stockRoutes);
app.use('/api/v1/reports', reportRoutes);

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

