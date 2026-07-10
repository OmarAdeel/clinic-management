import express from 'express';
import { body } from 'express-validator';
import {
  getMyAppointments, bookAppointment, cancelAppointment,
  getMyInvoices, getMyPrescriptions
} from '../lib/controllers/portal.controller.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { validate, cors } from '../lib/middleware.js';

const app = express();
app.use(express.json());
app.use(cors);

// GET /api/portal/appointments
app.get('/appointments', authenticate, requireRole('patient'), getMyAppointments);

// POST /api/portal/appointments
app.post('/appointments', authenticate, requireRole('patient'), [
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('start_time').notEmpty().withMessage('Start time is required'),
  validate,
], bookAppointment);

// DELETE /api/portal/appointments/:id
app.delete('/appointments/:id', authenticate, requireRole('patient'), cancelAppointment);

// GET /api/portal/invoices
app.get('/invoices', authenticate, requireRole('patient'), getMyInvoices);

// GET /api/portal/prescriptions
app.get('/prescriptions', authenticate, requireRole('patient'), getMyPrescriptions);

export default function handler(req, res) {
  return app(req, res);
}
