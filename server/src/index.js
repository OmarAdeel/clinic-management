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
import usersRoutes from './routes/users.routes.js';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/invoices', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/portal', portalRoutes);
app.use('/api/users', usersRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Clinic API running on http://localhost:${env.port}`);
});

export default app;
