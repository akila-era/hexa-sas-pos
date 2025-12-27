import { Router } from 'express';
import { featureToggleController } from '../../controllers/superadmin';

const router = Router();

// Feature toggle routes
router.get('/tenants', featureToggleController.getAllTenantsWithFeatures.bind(featureToggleController));
router.get('/tenants/:tenantId', featureToggleController.getTenantFeatures.bind(featureToggleController));
router.post('/enable', featureToggleController.enableFeature.bind(featureToggleController));
router.post('/disable', featureToggleController.disableFeature.bind(featureToggleController));
router.post('/toggle', featureToggleController.toggleFeature.bind(featureToggleController));
router.get('/available', featureToggleController.getAvailableFeatures.bind(featureToggleController));

export default router;

