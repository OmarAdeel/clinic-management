import { Router } from 'express';
import {
  summary, appointmentsPerDay, revenuePerMonth, statusBreakdown, topDoctors,
  doctorProductivity, noShowRateOverTime, revenueReport,
} from '../controllers/reports.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'doctor', 'receptionist'));

router.get('/summary', summary);
router.get('/appointments-per-day', appointmentsPerDay);
router.get('/revenue-per-month', requireRole('admin', 'receptionist'), revenuePerMonth);
router.get('/status-breakdown', statusBreakdown);
router.get('/top-doctors', requireRole('admin'), topDoctors);
router.get('/doctor-productivity', requireRole('admin'), doctorProductivity);
router.get('/no-show-rate', requireRole('admin'), noShowRateOverTime);
router.get('/revenue', requireRole('admin'), revenueReport);

export default router;
