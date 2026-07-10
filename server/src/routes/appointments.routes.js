import { Router } from 'express';
import { body } from 'express-validator';
import {
  listAppointments, getAppointment, availableSlots,
  createAppointment, updateStatus, deleteAppointment,
} from '../controllers/appointments.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/', requireRole('admin', 'doctor', 'receptionist'), listAppointments);
router.get('/slots', availableSlots); // patients also need slots for portal booking
router.get('/:id', requireRole('admin', 'doctor', 'receptionist'), getAppointment);

router.post(
  '/',
  requireRole('admin', 'receptionist'),
  body('patient_id').isInt(),
  body('doctor_id').isInt(),
  body('date').isDate(),
  body('start_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body('end_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  validate,
  createAppointment
);

router.patch(
  '/:id/status',
  requireRole('admin', 'doctor', 'receptionist'),
  body('status').isIn(['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show']),
  validate,
  updateStatus
);

router.delete('/:id', requireRole('admin'), deleteAppointment);

export default router;
