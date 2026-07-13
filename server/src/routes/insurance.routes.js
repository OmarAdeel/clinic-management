import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listProviders, createProvider, updateProvider,
  listClaims, getClaim, createClaim, updateClaimStatus,
} from '../controllers/insurance.controller.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'receptionist'));

// Providers
router.get('/providers', listProviders);
router.post(
  '/providers',
  body('name').trim().notEmpty(),
  body('contact_email').optional({ values: 'falsy' }).isEmail(),
  validate,
  createProvider
);
router.put('/providers/:id', validate, updateProvider);

// Claims
router.get('/claims', listClaims);
router.get('/claims/:id', getClaim);
router.post(
  '/claims',
  body('patient_id').isInt(),
  body('provider_id').isInt(),
  body('amount').isFloat({ min: 0 }),
  body('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected', 'paid', 'cancelled']),
  validate,
  createClaim
);
router.patch(
  '/claims/:id/status',
  body('status').isIn(['draft', 'submitted', 'approved', 'rejected', 'paid', 'cancelled']),
  validate,
  updateClaimStatus
);

export default router;
