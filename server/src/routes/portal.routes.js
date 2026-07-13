import { Router } from 'express';
import { body } from 'express-validator';
import {
  myProfile, myAppointments, myPrescriptions, myInvoices, bookAppointment,
  cancelMyAppointment, rescheduleMyAppointment, myLabResults,
} from '../controllers/portal.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireRole('patient'));

router.get('/profile', myProfile);
router.get('/me', myProfile);
router.get('/appointments', myAppointments);
router.get('/prescriptions', myPrescriptions);
router.get('/invoices', myInvoices);
router.get('/lab-results', myLabResults);

router.post(
  '/appointments',
  body('doctor_id').isInt(),
  body('date').isDate(),
  body('start_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body('end_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  validate,
  bookAppointment
);

router.put(
  '/appointments/:id',
  body('date').isDate(),
  body('start_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  body('end_time').matches(/^\d{2}:\d{2}(:\d{2})?$/),
  validate,
  rescheduleMyAppointment
);

router.delete('/appointments/:id', cancelMyAppointment);

export default router;
