import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { requireSuperAdmin } from '../../middlewares/superadmin.middleware';

import dashboardRoutes from './dashboard.routes';
import packageRoutes from './package.routes';
import subscriptionRoutes from './subscription.routes';
import domainRoutes from './domain.routes';
import transactionRoutes from './transaction.routes';
import companyRoutes from './company.routes';
import superAdminUsersRoutes from './superadmin-users.routes';
import featureToggleRoutes from './feature-toggle.routes';

const router = Router();

// All super admin routes require authentication and super admin role
router.use(authenticate);
router.use(requireSuperAdmin);

// Mount sub-routes
router.use('/dashboard', dashboardRoutes);
router.use('/packages', packageRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/domains', domainRoutes);
router.use('/transactions', transactionRoutes);
router.use('/companies', companyRoutes);
router.use('/users', superAdminUsersRoutes);
router.use('/features', featureToggleRoutes);

export default router;

