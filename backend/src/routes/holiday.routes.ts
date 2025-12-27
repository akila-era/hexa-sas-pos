import { Router } from 'express';
import holidayController from '../controllers/holiday.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', holidayController.getAll.bind(holidayController));
router.get('/:id', holidayController.getById.bind(holidayController));
router.post('/', holidayController.create.bind(holidayController));
router.put('/:id', holidayController.update.bind(holidayController));
router.delete('/:id', holidayController.delete.bind(holidayController));

export default router;

