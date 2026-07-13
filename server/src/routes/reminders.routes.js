import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { triggerReminders } from '../controllers/reminders.controller.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

// Manually fire a reminder sweep (testing / on-demand).
router.post('/sweep', triggerReminders);

export default router;
