import express from 'express';
import { body } from 'express-validator';
import { 
  getPatients, createPatient, getPatient, updatePatient, deletePatient 
} from '../lib/controllers/patients.controller.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { validate, cors } from '../lib/middleware.js';

const app = express();
app.use(express.json());
app.use(cors);

// GET /api/patients
app.get('/', authenticate, getPatients);

// POST /api/patients
app.post('/', authenticate, requireRole('admin', 'receptionist'), [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('phone').optional(),
  body('email').optional().isEmail(),
  validate,
], createPatient);

// GET /api/patients/:id
app.get('/:id', authenticate, getPatient);

// PUT /api/patients/:id
app.put('/:id', authenticate, requireRole('admin', 'receptionist'), updatePatient);

// DELETE /api/patients/:id
app.delete('/:id', authenticate, requireRole('admin'), deletePatient);

export default function handler(req, res) {
  return app(req, res);
}
