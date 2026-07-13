import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { getClinicProfile, updateClinicProfile } from '../controllers/clinic.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', getClinicProfile);
router.put(
  '/',
  requireRole('admin'),
  body('name').optional().trim(),
  body('email').optional({ values: 'falsy' }).isEmail(),
  validate,
  updateClinicProfile
);

export default router;
