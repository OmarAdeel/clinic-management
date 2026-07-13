import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listLeave, createLeave, deleteLeave,
} from '../controllers/leave.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', listLeave);
router.post(
  '/',
  requireRole('admin', 'receptionist'),
  body('doctor_id').isInt(),
  body('start_date').isDate(),
  body('end_date').isDate(),
  body('reason').optional().trim(),
  validate,
  createLeave
);
router.delete('/:id', requireRole('admin', 'receptionist'), deleteLeave);

export default router;
