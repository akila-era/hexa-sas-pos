import { Router } from 'express';
import settingsController from '../controllers/settings.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', settingsController.getAll.bind(settingsController));
router.get('/group/:group', settingsController.getByGroup.bind(settingsController));
router.get('/:group/:key', settingsController.get.bind(settingsController));
router.post('/', settingsController.set.bind(settingsController));
router.post('/batch', settingsController.setMany.bind(settingsController));
router.post('/initialize', settingsController.initializeDefaults.bind(settingsController));
router.delete('/:group/:key', settingsController.delete.bind(settingsController));

export default router;

