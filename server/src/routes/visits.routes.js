import { Router } from 'express';
import { body } from 'express-validator';
import { upsertVisit, getVisit } from '../controllers/visits.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate);

router.get('/:id', requireRole('admin', 'doctor', 'receptionist'), getVisit);

router.post(
  '/',
  requireRole('admin', 'doctor'),
  body('appointment_id').isInt(),
  body('prescriptions').optional().isArray(),
  body('prescriptions.*.medication').if(body('prescriptions').exists()).trim().notEmpty(),
  validate,
  upsertVisit
);

export default router;
