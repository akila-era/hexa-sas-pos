import { Router } from 'express';
import attendanceController from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', attendanceController.getAll.bind(attendanceController));
router.get('/today', attendanceController.getTodayAttendance.bind(attendanceController));
router.get('/employee/:employeeId', attendanceController.getEmployeeAttendance.bind(attendanceController));
router.post('/clock-in', attendanceController.clockIn.bind(attendanceController));
router.post('/clock-out', attendanceController.clockOut.bind(attendanceController));
router.post('/mark-absent', attendanceController.markAbsent.bind(attendanceController));

export default router;

