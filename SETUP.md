# Clinic Management System - Setup Guide

## Database Credentials

Your Supabase PostgreSQL database is already configured:

```
Host:     db.ckhpfrlmrrjwmncougmq.supabase.co
Port:     5432
Database: postgres
User:     postgres
Password: #9v5ZpglbBl
Project:  ckhpfrlmrrjwmncougmq
```

✅ Schema and seed data are **already created** in your database with:
- 10 tables (users, doctors, patients, appointments, visits, prescriptions, invoices, payments, etc.)
- 5 demo accounts with full permissions
- 70+ rows of realistic demo data

---

## Quick Start - Local Development

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm or yarn
- Your database credentials above

### Step 1: Clone and Install

```bash
# Backend
cd server
npm install

# Frontend (in another terminal)
cd client
npm install
```

### Step 2: Backend Configuration

The `.env` file is already configured with your Supabase credentials:

```bash
cd server
# Verify .env exists with correct credentials
cat .env
```

Expected `.env`:
```
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

DB_HOST=db.ckhpfrlmrrjwmncougmq.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=#9v5ZpglbBl
DB_NAME=postgres

JWT_SECRET=cLInIcMgMt_s3cr3t_2026_xZ9pQ!
JWT_EXPIRES_IN=12h
```

### Step 3: Start Backend

```bash
cd server
npm run dev
```

Expected output:
```
[v0] Server running on http://localhost:5000
[v0] Database: postgres
[v0] Environment: development
```

Test the health check:
```bash
curl http://localhost:5000/api/health
```

### Step 4: Start Frontend

In a new terminal:
```bash
cd client
npm run dev
```

Expected output:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 5: Access the Application

Open **http://localhost:5173** in your browser.

---

## Demo Login Credentials

All demo accounts use password: **`password123`**

### Admin Dashboard
- **Email:** `admin@clinic.com`
- **Password:** `password123`
- **Role:** Admin (full access)

### Doctor Portal
- **Email:** `doctor@clinic.com`
- **Password:** `password123`
- **Specialty:** General Medicine

### Second Doctor
- **Email:** `layla@clinic.com`
- **Password:** `password123`
- **Specialty:** Pediatrics

### Receptionist
- **Email:** `reception@clinic.com`
- **Password:** `password123`
- **Role:** Receptionist (appointment & billing)

### Patient Portal
- **Email:** `patient@clinic.com`
- **Password:** `password123`
- **Role:** Patient (book appointments, view records)

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (returns JWT token)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user profile

### Patients
- `GET /api/patients` - List patients (paginated)
- `GET /api/patients/:id` - Get patient details
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment status
- `GET /api/appointments/available-slots` - Get available slots

### Doctors
- `GET /api/doctors` - List doctors
- `GET /api/doctors/:id/schedule` - Doctor's weekly schedule

### Visits
- `POST /api/visits` - Create visit record
- `GET /api/visits/:appointmentId` - Get visit details
- `POST /api/visits/:id/prescriptions` - Add prescriptions

### Invoices
- `GET /api/invoices` - List invoices
- `POST /api/invoices` - Create invoice
- `POST /api/invoices/:id/pay` - Record payment

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/revenue` - Revenue analytics
- `GET /api/reports/top-doctors` - Top doctors by appointments

---

## Database Schema

### Tables (10 total)

| Table | Purpose | Rows |
|-------|---------|------|
| `users` | User accounts & auth | 5 |
| `doctors` | Doctor profiles & specialties | 2 |
| `doctor_schedules` | Weekly availability slots | 10 |
| `patients` | Patient records & medical history | 10 |
| `appointments` | Scheduled visits | 16 |
| `visits` | Visit records (diagnosis, vitals) | 7 |
| `prescriptions` | Medications prescribed | 6 |
| `invoices` | Billing records | 7 |
| `invoice_items` | Invoice line items | 10 |
| `payments` | Payment records | 5 |

### Features
- ✅ Full UTF-8 support (English & Arabic ready)
- ✅ JSONB for complex data (vitals, metadata)
- ✅ Proper timezone handling (TIMESTAMPTZ)
- ✅ Indexes on frequently queried columns
- ✅ Foreign key relationships with cascades

---

## Frontend Features

### Implemented Pages
- ✅ **Login** - JWT-based authentication
- ✅ **Dashboard** - Stats, recent appointments, revenue charts
- ✅ **Patients** - CRUD operations, search, detail view
- ✅ **Appointments** - Calendar view, booking, status updates
- ✅ **Doctors & Staff** - Profiles, schedules, availability
- ✅ **Visits & Prescriptions** - Diagnosis, vitals, prescription printing
- ✅ **Billing** - Invoice creation, payment tracking, printing
- ✅ **Reports** - Revenue charts, appointment analytics
- ✅ **Patient Portal** - Self-service booking, medical records

### Design Features
- 🎨 Teal medical theme with professional animations
- 🌐 Full English/Arabic support with RTL layout mirroring
- 📱 Responsive design (desktop, tablet, mobile)
- 🎯 Smooth page transitions and staggered animations
- 🌙 Dark mode support
- ♿ Accessible components (ARIA labels, semantic HTML)

---

## Backend Architecture

### Tech Stack
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL (Supabase)
- **Driver:** `pg` (node-postgres)
- **Auth:** JWT (jsonwebtoken)
- **Password Hashing:** bcryptjs
- **Validation:** Joi

### Folder Structure
```
server/
├── src/
│   ├── config/
│   │   ├── db.js          # Database pool & query helpers
│   │   └── env.js         # Environment variables
│   ├── middleware/
│   │   ├── auth.js        # JWT verification
│   │   ├── validate.js    # Request validation
│   │   └── errors.js      # Error handling
│   ├── controllers/       # Business logic
│   │   ├── auth.controller.js
│   │   ├── patients.controller.js
│   │   ├── doctors.controller.js
│   │   ├── appointments.controller.js
│   │   ├── visits.controller.js
│   │   ├── billing.controller.js
│   │   ├── reports.controller.js
│   │   └── portal.controller.js
│   ├── routes/            # API route definitions
│   ├── utils/
│   │   └── helpers.js
│   └── index.js           # Express app entry point
├── database/
│   ├── schema.sql         # Table definitions
│   ├── seed.sql           # Demo data
│   └── migrate.js         # Migration runner
└── package.json
```

### Key Features
- Role-based access control (Admin, Doctor, Receptionist, Patient)
- JWT token-based authentication
- Pagination support on list endpoints
- Input validation on all routes
- Proper error handling with status codes
- SQL injection prevention via parameterized queries

---

## Frontend Architecture

### Tech Stack
- **Framework:** React 18+
- **Build:** Vite
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Data Fetching:** SWR
- **Internationalization:** i18n (EN/AR)
- **Routing:** React Router v6

### Folder Structure
```
client/
├── src/
│   ├── components/
│   │   ├── layout/        # AppLayout, Sidebar, Topbar
│   │   ├── ui/            # Reusable components
│   │   ├── patients/      # Patient-specific components
│   │   ├── appointments/  # Appointment components
│   │   ├── doctors/       # Doctor components
│   │   ├── visits/        # Visit & prescription components
│   │   └── billing/       # Invoice components
│   ├── pages/             # Route pages
│   ├── context/           # AuthContext, LanguageContext
│   ├── lib/
│   │   ├── api.js         # API client
│   │   └── format.js      # Formatters
│   ├── i18n/              # Translations (EN/AR)
│   ├── index.css          # Tailwind + theme
│   ├── App.jsx            # Router
│   └── main.jsx           # Entry point
└── vite.config.js
```

### Component Features
- Animated transitions with staggered effects
- Responsive grid/flex layouts
- Skeleton loaders for loading states
- Empty state handling
- Modal dialogs for forms
- Tables with pagination
- Toast notifications

---

## Troubleshooting

### Backend won't connect to database
**Problem:** `ENETUNREACH` or `ECONNREFUSED`

**Solution:** 
- Verify `.env` has correct credentials
- Check internet connection
- Ensure Supabase project is running (check dashboard)
- Try from a different terminal/session

### Frontend shows 404 errors
**Problem:** API calls returning 404

**Solution:**
- Make sure backend is running (`npm run dev` in `server/` folder)
- Verify `CLIENT_ORIGIN` in `.env` matches frontend origin
- Check browser console for CORS errors
- Try logging in again to refresh JWT token

### Port already in use
**Problem:** `EADDRINUSE` on port 5000 or 5173

**Solution:**
```bash
# Kill process on port 5000 (backend)
lsof -i :5000 | grep -v PID | awk '{print $2}' | xargs kill -9

# Kill process on port 5173 (frontend)
lsof -i :5173 | grep -v PID | awk '{print $2}' | xargs kill -9
```

### Login fails
**Problem:** Invalid email/password

**Solution:**
- Double-check email and password (case-sensitive)
- Use demo account: `admin@clinic.com` / `password123`
- Check server logs for error details
- Database may not have seed data - run `node database/migrate.js --seed`

---

## Production Deployment

### Environment Setup
Update `.env` with production values:
```
NODE_ENV=production
PORT=5000  # or your hosting platform's port
JWT_SECRET=<generate-strong-secret>
JWT_EXPIRES_IN=24h
CLIENT_ORIGIN=https://yourdomain.com
```

### Database
Your Supabase database is production-ready:
- SSL enabled
- Automatic backups
- Point-in-time recovery available
- Performance monitoring

### Deploy Backend
```bash
# Build
cd server && npm install --production

# Start
node src/index.js
```

### Deploy Frontend
```bash
# Build
cd client && npm run build

# Serve dist/ directory
npm run preview
```

### Recommended Platforms
- **Backend:** Vercel, Railway, Render, DigitalOcean
- **Frontend:** Vercel, Netlify, GitHub Pages
- **Database:** Supabase (already set up)

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend logs: `npm run dev` shows detailed errors
3. Check browser DevTools console for frontend errors
4. Verify database connection in Supabase dashboard

---

**Happy building! 🚀**
