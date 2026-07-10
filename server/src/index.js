import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { query } from './config/db.js';

import authRoutes from './routes/auth.routes.js';
import patientsRoutes from './routes/patients.routes.js';
import doctorsRoutes from './routes/doctors.routes.js';
import appointmentsRoutes from './routes/appointments.routes.js';
import visitsRoutes from './routes/visits.routes.js';
import billingRoutes from './routes/billing.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import portalRoutes from './routes/portal.routes.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/debug', async (req, res) => {
  const info = {
    dbHost: env.db.host,
    dbPort: env.db.port,
    dbUser: env.db.user,
    dbName: env.db.database,
    hasPassword: !!env.db.password,
    jwtSecret: env.jwtSecret ? env.jwtSecret.substring(0, 6) + '...' : 'MISSING',
    processEnvKeys: Object.keys(process.env).filter(k => k.startsWith('DB_') || k.startsWith('JWT_') || k === 'CLIENT_ORIGIN'),
    globalThisKeys: ['DB_HOST','DB_PASSWORD','JWT_SECRET','CLIENT_ORIGIN'].filter(k => !!globalThis[k]),
  };
  try {
    const rows = await query('SELECT id, full_name, dob, gender, phone, email, blood_type, created_at FROM patients ORDER BY created_at DESC LIMIT 10 OFFSET 0');
    info.dbConnected = true;
    info.dbResult = rows;
  } catch (err) {
    info.dbConnected = false;
    info.dbError = err.message;
    info.dbStack = err.stack;
  }
  res.json(info);
});

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/invoices', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/portal', portalRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Clinic API running on http://localhost:${env.port}`);
});

export default app;
