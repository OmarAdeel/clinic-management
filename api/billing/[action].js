import express from 'express';
import { body } from 'express-validator';
import {
  getInvoices, createInvoice, getInvoice, updateInvoice, deleteInvoice,
  recordPayment
} from '../lib/controllers/billing.controller.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { validate, cors } from '../lib/middleware.js';

const app = express();
app.use(express.json());
app.use(cors);

// GET /api/billing/invoices
app.get('/invoices', authenticate, getInvoices);

// POST /api/billing/invoices
app.post('/invoices', authenticate, requireRole('admin', 'receptionist'), [
  body('patient_id').notEmpty().withMessage('Patient ID is required'),
  validate,
], createInvoice);

// GET /api/billing/invoices/:id
app.get('/invoices/:id', authenticate, getInvoice);

// PUT /api/billing/invoices/:id
app.put('/invoices/:id', authenticate, requireRole('admin', 'receptionist'), updateInvoice);

// DELETE /api/billing/invoices/:id
app.delete('/invoices/:id', authenticate, requireRole('admin'), deleteInvoice);

// POST /api/billing/payments
app.post('/payments', authenticate, requireRole('admin', 'receptionist'), [
  body('invoice_id').notEmpty().withMessage('Invoice ID is required'),
  body('amount').notEmpty().withMessage('Amount is required'),
  validate,
], recordPayment);

export default function handler(req, res) {
  return app(req, res);
}
