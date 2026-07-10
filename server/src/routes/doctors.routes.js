import { Router } from 'express';
import { body } from 'express-validator';
import {
  listDoctors, getDoctor, createDoctor, updateDoctor, updateSchedule,
} from '../controllers/doctors.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

// Any staff or patient can list doctors (needed for booking)
router.get('/', listDoctors);
router.get('/:id', getDoctor);

router.post(
  '/',
  requireRole('admin'),
  body('name').trim().notEmpty(),
  body('email').isEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('specialty').trim().notEmpty(),
  validate,
  createDoctor
);

router.put(
  '/:id',
  requireRole('admin'),
  body('name').trim().notEmpty(),
  body('specialty').trim().notEmpty(),
  validate,
  updateDoctor
);

router.put(
  '/:id/schedule',
  requireRole('admin'),
  body('schedules').isArray().withMessage('schedules must be an array'),
  body('schedules.*.day_of_week').isInt({ min: 0, max: 6 }),
  body('schedules.*.start_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body('schedules.*.end_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  validate,
  updateSchedule
);

export default router;
