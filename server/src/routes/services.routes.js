import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  listServices, getService, createService, updateService, deleteService,
} from '../controllers/services.controller.js';

const router = Router();
router.use(authenticate);

router.get('/', listServices);
router.get('/:id', getService);

router.post(
  '/',
  requireRole('admin', 'receptionist'),
  body('name').trim().notEmpty().withMessage('Service name is required'),
  body('category').optional().isIn(['consultation', 'procedure', 'lab', 'imaging', 'medicine', 'other']),
  body('unit_price').isFloat({ min: 0 }).withMessage('Unit price must be a non-negative number'),
  body('is_active').optional().isBoolean(),
  validate,
  createService
);

router.put(
  '/:id',
  requireRole('admin', 'receptionist'),
  body('name').trim().notEmpty(),
  body('category').optional().isIn(['consultation', 'procedure', 'lab', 'imaging', 'medicine', 'other']),
  body('unit_price').isFloat({ min: 0 }),
  body('is_active').optional().isBoolean(),
  validate,
  updateService
);

router.delete('/:id', requireRole('admin'), deleteService);

export default router;
