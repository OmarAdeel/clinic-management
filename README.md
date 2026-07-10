# Clinic Management System

A full-stack clinic management application.

- **Backend:** Node.js + Express + MySQL (`server/`)
- **Frontend:** React (Vite) + TailwindCSS + framer-motion (`client/`)
- **Languages:** English (default) and Arabic with full RTL support
- **Roles:** Admin, Doctor, Receptionist, Patient portal

> This codebase is designed to run locally on your machine. It requires Node.js 18+ and MySQL 8+.

## Modules

| Module | Description |
| --- | --- |
| Dashboard | Role-aware stats, charts, today's schedule |
| Patients | Records, medical history, visits, invoices |
| Appointments | Week calendar + list, slot-based booking with conflict checks |
| Doctors & Staff | Profiles, specialties, weekly schedule editor |
| Visits & Prescriptions | Vitals, diagnosis, printable prescriptions |
| Billing | Invoices, line items, payments, printable invoices |
| Reports | Revenue, appointment trends, status breakdown, top doctors |
| Patient Portal | Book appointments, view own prescriptions and invoices |

## 1. Database Setup (MySQL)

```bash
mysql -u root -p -e "CREATE DATABASE clinic_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
mysql -u root -p clinic_db < server/database/schema.sql
mysql -u root -p clinic_db < server/database/seed.sql
```

## 2. Backend

```bash
cd server
cp .env.example .env    # edit DB credentials and JWT_SECRET
npm install
npm run dev             # API on http://localhost:5000
```

## 3. Frontend

```bash
cd client
npm install
npm run dev             # App on http://localhost:5173
```

## Demo Accounts

All accounts use the password: **password123**

| Role | Email |
| --- | --- |
| Admin | admin@clinic.com |
| Doctor | doctor@clinic.com |
| Receptionist | reception@clinic.com |
| Patient | patient@clinic.com |

## Language Support

The app defaults to English. Use the language toggle in the top bar to switch to Arabic — the entire layout mirrors to RTL automatically, and an Arabic font (IBM Plex Sans Arabic) is applied.
