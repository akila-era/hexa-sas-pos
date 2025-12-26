import { Router } from 'express';
import superAdminUsersController from '../../controllers/superadmin/superadmin-users.controller';

const router = Router();

router.post('/', superAdminUsersController.create.bind(superAdminUsersController));
router.get('/', superAdminUsersController.findAll.bind(superAdminUsersController));
router.get('/:id', superAdminUsersController.findOne.bind(superAdminUsersController));
router.put('/:id', superAdminUsersController.update.bind(superAdminUsersController));
router.delete('/:id', superAdminUsersController.delete.bind(superAdminUsersController));
router.patch('/:id/toggle-status', superAdminUsersController.toggleStatus.bind(superAdminUsersController));

export default router;





