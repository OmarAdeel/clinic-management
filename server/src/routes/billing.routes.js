import { Router } from 'express';
import { body } from 'express-validator';
import {
  listInvoices, getInvoice, createInvoice, recordPayment, cancelInvoice,
} from '../controllers/billing.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
router.use(authenticate, requireRole('admin', 'receptionist'));

router.get('/', listInvoices);
router.get('/:id', getInvoice);

router.post(
  '/',
  body('patient_id').isInt(),
  body('items').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('items.*.description').trim().notEmpty(),
  body('items.*.qty').isInt({ min: 1 }),
  body('items.*.unit_price').isFloat({ min: 0 }),
  validate,
  createInvoice
);

router.post(
  '/:id/payments',
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('method').optional().isIn(['cash', 'card', 'transfer', 'insurance']),
  validate,
  recordPayment
);

router.patch('/:id/cancel', cancelInvoice);

export default router;
