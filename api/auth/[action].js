import express from 'express';
import { body } from 'express-validator';
import { login, me } from '../lib/controllers/auth.controller.js';
import { authenticate } from '../lib/auth.js';
import { validate, cors } from '../lib/middleware.js';

const app = express();
app.use(express.json());
app.use(cors);

// POST /api/auth/login
app.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
], login);

// GET /api/auth/me
app.get('/me', authenticate, me);

export default function handler(req, res) {
  return app(req, res);
}
