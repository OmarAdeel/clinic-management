import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listLabTests, getLabTest, createLabTests, setResult, cancelLabTest,
  listCatalog, addCatalogItem,
} from '../controllers/lab.controller.js';

const router = Router();
router.use(authenticate);

// Patient lab tests
router.get('/', requireRole('admin', 'doctor', 'receptionist'), listLabTests);
router.get('/catalog', listCatalog);
router.get('/:id', requireRole('admin', 'doctor', 'receptionist'), getLabTest);

router.post(
  '/',
  requireRole('admin', 'doctor'),
  body('patient_id').isInt(),
  body('tests').isArray({ min: 1 }),
  body('tests.*.name').trim().notEmpty(),
  validate,
  createLabTests
);

router.put(
  '/:id/result',
  requireRole('admin', 'doctor'),
  body('result_value').optional().trim(),
  body('abnormal').optional().isBoolean(),
  validate,
  setResult
);

router.patch('/:id/cancel', requireRole('admin', 'doctor'), cancelLabTest);

// Lab catalog admin
router.post(
  '/catalog',
  requireRole('admin'),
  body('name').trim().notEmpty(),
  body('price').optional().isFloat({ min: 0 }),
  validate,
  addCatalogItem
);

export default router;
