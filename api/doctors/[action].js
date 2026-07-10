import express from 'express';
import { body } from 'express-validator';
import {
  getDoctors, createDoctor, getDoctor, updateDoctor, deleteDoctor,
  getSchedules, updateSchedules
} from '../lib/controllers/doctors.controller.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { validate, cors } from '../lib/middleware.js';

const app = express();
app.use(express.json());
app.use(cors);

// GET /api/doctors
app.get('/', authenticate, getDoctors);

// POST /api/doctors
app.post('/', authenticate, requireRole('admin'), [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('specialty').notEmpty().withMessage('Specialty is required'),
  validate,
], createDoctor);

// GET /api/doctors/:id
app.get('/:id', authenticate, getDoctor);

// PUT /api/doctors/:id
app.put('/:id', authenticate, requireRole('admin'), updateDoctor);

// DELETE /api/doctors/:id
app.delete('/:id', authenticate, requireRole('admin'), deleteDoctor);

// GET /api/doctors/:id/schedules
app.get('/:id/schedules', authenticate, getSchedules);

// PUT /api/doctors/:id/schedules
app.put('/:id/schedules', authenticate, requireRole('admin', 'doctor'), updateSchedules);

export default function handler(req, res) {
  return app(req, res);
}
