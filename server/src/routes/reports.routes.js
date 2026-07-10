import { Router } from 'express';
import {
  summary, appointmentsPerDay, revenuePerMonth, statusBreakdown, topDoctors,
} from '../controllers/reports.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'doctor', 'receptionist'));

router.get('/summary', summary);
router.get('/appointments-per-day', appointmentsPerDay);
router.get('/revenue-per-month', requireRole('admin', 'receptionist'), revenuePerMonth);
router.get('/status-breakdown', statusBreakdown);
router.get('/top-doctors', requireRole('admin'), topDoctors);

export default router;
