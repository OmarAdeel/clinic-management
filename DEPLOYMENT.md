# Complete Deployment Guide - Clinic Management System

## Quick Start (Recommended)

Frontend on **Vercel** ✓ (already deployed)
Backend on **Render** (free tier, 5 min setup)
Database on **Supabase** ✓ (ready to use)

---

## Step 1: Deploy Backend to Render

### 1.1 Connect Repository

1. Go to https://render.com
2. Sign up / Log in
3. Click **"New +"** → **"Web Service"**
4. Select **"Public Git repository"**
5. Paste your GitHub repo: `https://github.com/OmarAdeel/clinic-management`
6. Connect

### 1.2 Configure Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | clinic-backend |
| **Branch** | main |
| **Root Directory** | server |
| **Build Command** | npm install |
| **Start Command** | npm start |
| **Instance Type** | Free |

### 1.3 Add Environment Variables

Click **"Advanced"** and add these:

```
DB_HOST=db.ckhpfrlmrrjwmncougmq.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=#9v5ZpglbBl
DB_NAME=postgres
JWT_SECRET=cLInIcMgMt_s3cr3t_2026_xZ9pQ!
PORT=5000
NODE_ENV=production
CLIENT_ORIGIN=https://clinic-management-bzlmsyirc-omarhitman2010-6379s-projects.vercel.app
```

**Important:** Replace `clinic-management-bzlmsyirc-omarhitman2010-6379s-projects.vercel.app` with your actual Vercel URL.

### 1.4 Deploy

Click **"Create Web Service"**

Wait 5-10 minutes for deployment. You'll see a URL like:
```
https://clinic-backend-xxxx.onrender.com
```

Copy this URL ⭐ You'll need it next.

---

## Step 2: Connect Frontend to Backend

### 2.1 Add Environment Variable in Vercel

1. Go to **Vercel Dashboard** → Your Project
2. Click **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://clinic-backend-xxxx.onrender.com` (your Render URL from Step 1.4)
   - **Environments:** Check all (Production, Preview, Development)
4. Click **"Add"**

### 2.2 Redeploy Frontend

1. Go to **Deployments**
2. Find the latest deployment
3. Click the three dots → **"Redeploy"**
4. Wait for deployment (2-3 min)

---

## Step 3: Verify Everything Works

1. Open your frontend: https://clinic-management-bzlmsyirc-omarhitman2010-6379s-projects.vercel.app
2. You should see the login page
3. Login with:
   - **Email:** admin@clinic.com
   - **Password:** password123
4. Should see the dashboard with data

---

## Database Setup (One-time)

If tables haven't been created yet:

1. Go to your **Supabase Dashboard**
2. Click **SQL Editor** → **New Query**
3. Copy entire content from: `server/database/supabase-setup.sql`
4. Paste and click **Run**
5. Wait 1 min, all 10 tables will be created with demo data

---

## Demo Accounts

All passwords: `password123`

| Email | Role | Access |
|-------|------|--------|
| admin@clinic.com | Admin | Full access |
| doctor@clinic.com | Doctor | Doctor dashboard |
| layla@clinic.com | Doctor | Doctor dashboard |
| reception@clinic.com | Receptionist | Reception tasks |
| patient@clinic.com | Patient | Patient portal |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  User Browser                                       │
│  https://clinic-management-bzlmsyirc-...vercel.app │
└────────────┬────────────────────────────────────────┘
             │
             │ (HTTPS)
             ▼
┌─────────────────────────────────────────────────────┐
│  Vercel (Frontend - React)                          │
│  - /login, /dashboard, /patients, /appointments     │
│  - /doctors, /billing, /reports, /portal            │
│  - VITE_API_URL = https://clinic-backend-xxxx...   │
└────────────┬────────────────────────────────────────┘
             │
             │ API Calls (HTTPS)
             ▼
┌─────────────────────────────────────────────────────┐
│  Render (Backend - Express)                         │
│  https://clinic-backend-xxxx.onrender.com           │
│  - /api/auth/login, /api/patients, /api/doctors     │
│  - /api/appointments, /api/billing, /api/reports    │
└────────────┬────────────────────────────────────────┘
             │
             │ SQL Queries (PostgreSQL Driver + SSL)
             ▼
┌─────────────────────────────────────────────────────┐
│  Supabase (Database - PostgreSQL)                   │
│  db.ckhpfrlmrrjwmncougmq.supabase.co:5432           │
│  - 10 tables, 70+ rows of demo data                 │
│  - users, patients, doctors, appointments,          │
│  - visits, prescriptions, invoices, payments        │
└─────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### "404 NOT_FOUND" on Frontend

**Cause:** Backend URL not set or wrong

**Fix:**
1. Check Vercel → Settings → Environment Variables
2. Verify `VITE_API_URL` is set correctly
3. Redeploy frontend
4. Hard refresh browser (Ctrl+Shift+R)

### "Connection Refused" on Login

**Cause:** Render backend not running or just started

**Fix:**
1. Go to Render → Your Service → Logs
2. Look for startup errors
3. Restart service if needed
4. Wait 5-10 min for cold start
5. Try again

### "Cannot reach database"

**Cause:** Supabase credentials wrong or database down

**Fix:**
1. Verify credentials in Render env vars match Supabase project
2. Check Supabase dashboard is accessible
3. Run setup SQL if tables not created

### "401 Unauthorized" after login

**Cause:** JWT secret mismatch

**Fix:**
- Verify `JWT_SECRET` in Render env vars matches between services
- Re-login (clear sessionStorage)

---

## Performance Tips

- **Render free tier:** Cold starts take 5-10 sec first request, then runs normally
- **Supabase:** Included 50k requests/month free tier
- **Vercel:** Unlimited requests for static + serverless

---

## Advanced: Custom Domain

1. **Domain registrar** (GoDaddy, Namecheap, etc.)
2. **Vercel:** Settings → Domains → Add custom domain
3. **Render:** Environment Variables → Add custom domain in `CLIENT_ORIGIN`

---

## Next Steps

- [ ] Deploy backend to Render
- [ ] Set `VITE_API_URL` in Vercel
- [ ] Redeploy frontend
- [ ] Test login
- [ ] Create tables in Supabase (if needed)
- [ ] Verify all features work
- [ ] Share app with team!

