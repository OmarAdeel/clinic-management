import express from 'express';
import { body } from 'express-validator';
import {
  getVisits, createVisit, getVisit, updateVisit
} from '../lib/controllers/visits.controller.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { validate, cors } from '../lib/middleware.js';

const app = express();
app.use(express.json());
app.use(cors);

// GET /api/visits
app.get('/', authenticate, getVisits);

// POST /api/visits
app.post('/', authenticate, requireRole('admin', 'doctor'), [
  body('appointment_id').notEmpty().withMessage('Appointment ID is required'),
  validate,
], createVisit);

// GET /api/visits/:id
app.get('/:id', authenticate, getVisit);

// PUT /api/visits/:id
app.put('/:id', authenticate, requireRole('admin', 'doctor'), updateVisit);

export default function handler(req, res) {
  return app(req, res);
}
