import { Router } from 'express';
import { subscriptionController } from '../../controllers/superadmin';

const router = Router();

// Subscription routes
router.get('/stats', subscriptionController.getStats.bind(subscriptionController));
router.post('/update-expired', subscriptionController.updateExpired.bind(subscriptionController));
router.get('/', subscriptionController.findAll.bind(subscriptionController));
router.post('/', subscriptionController.create.bind(subscriptionController));
router.get('/:id', subscriptionController.findOne.bind(subscriptionController));
router.delete('/:id', subscriptionController.delete.bind(subscriptionController));

export default router;









