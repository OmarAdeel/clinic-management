import express from 'express';
import { body } from 'express-validator';
import {
  getAppointments, createAppointment, getAppointment, updateAppointment,
  deleteAppointment, getAvailableSlots
} from '../lib/controllers/appointments.controller.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { validate, cors } from '../lib/middleware.js';

const app = express();
app.use(express.json());
app.use(cors);

// GET /api/appointments
app.get('/', authenticate, getAppointments);

// POST /api/appointments
app.post('/', authenticate, [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  body('doctor_id').notEmpty().withMessage('Doctor ID is required'),
  body('date').notEmpty().withMessage('Date is required'),
  body('start_time').notEmpty().withMessage('Start time is required'),
  validate,
], createAppointment);

// GET /api/appointments/:id
app.get('/:id', authenticate, getAppointment);

// PUT /api/appointments/:id
app.put('/:id', authenticate, updateAppointment);

// DELETE /api/appointments/:id
app.delete('/:id', authenticate, deleteAppointment);

// GET /api/appointments/doctor/:doctorId/slots
app.get('/doctor/:doctorId/slots', authenticate, getAvailableSlots);

export default function handler(req, res) {
  return app(req, res);
}
