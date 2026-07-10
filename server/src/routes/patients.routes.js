import { Router } from 'express';
import { body } from 'express-validator';
import {
  listPatients, getPatient, createPatient, updatePatient, deletePatient,
} from '../controllers/patients.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'doctor', 'receptionist'));

const patientRules = [
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('dob').optional({ values: 'falsy' }).isDate().withMessage('Invalid date of birth'),
  body('gender').optional({ values: 'falsy' }).isIn(['male', 'female']),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email'),
];

router.get('/', listPatients);
router.get('/:id', getPatient);
router.post('/', requireRole('admin', 'receptionist'), patientRules, validate, createPatient);
router.put('/:id', requireRole('admin', 'receptionist'), patientRules, validate, updatePatient);
router.delete('/:id', requireRole('admin'), deletePatient);

export default router;
