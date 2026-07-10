import express from 'express';
import {
  getDashboardStats, getRevenueData, getAppointmentStats,
  getTopDoctors
} from '../lib/controllers/reports.controller.js';
import { authenticate, requireRole } from '../lib/auth.js';
import { cors } from '../lib/middleware.js';

const app = express();
app.use(express.json());
app.use(cors);

// GET /api/reports/dashboard
app.get('/dashboard', authenticate, requireRole('admin', 'doctor'), getDashboardStats);

// GET /api/reports/revenue
app.get('/revenue', authenticate, requireRole('admin'), getRevenueData);

// GET /api/reports/appointments
app.get('/appointments', authenticate, requireRole('admin'), getAppointmentStats);

// GET /api/reports/top-doctors
app.get('/top-doctors', authenticate, requireRole('admin'), getTopDoctors);

export default function handler(req, res) {
  return app(req, res);
}
