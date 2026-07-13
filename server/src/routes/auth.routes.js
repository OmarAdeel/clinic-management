import { Router } from 'express';
import { body } from 'express-validator';
import { login, me, changePassword } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post(
  '/login',
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
  login
);

router.get('/me', authenticate, me);

router.put(
  '/me/password',
  authenticate,
  body('current_password').notEmpty().withMessage('Current password is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  validate,
  changePassword
);

export default router;
