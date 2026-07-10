# 🚀 START HERE - Clinic Management System

## Your App Status

✅ **Frontend** - Already deployed on Vercel  
⏳ **Backend** - Ready to deploy (Express server)  
✅ **Database** - Ready to use (Supabase PostgreSQL)  

---

## 3-Step Deploy (10 minutes)

### ✅ DONE: Frontend on Vercel
Your React app is live at:
```
https://clinic-management-bzlmsyirc-omarhitman2010-6379s-projects.vercel.app
```

**Current Issue:** Shows 404 because backend isn't deployed yet

---

### ⏳ STEP 1: Deploy Backend to Render (5 min)

1. Go to https://render.com → Sign up
2. Click "New +" → "Web Service" → "Public Git repository"
3. Enter: `https://github.com/OmarAdeel/clinic-management`
4. Fill in:
   - Name: `clinic-backend`
   - Root Directory: `server`
   - Build: `npm install`
   - Start: `npm start`
   - Instance: `Free`

5. Add these Environment Variables:
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

6. Click "Create Web Service"
7. **Wait 5-10 minutes** and copy the URL: `https://clinic-backend-xxxx.onrender.com`

---

### ⏳ STEP 2: Connect Frontend to Backend (2 min)

1. Go to Vercel Dashboard → Your project → Settings → Environment Variables
2. Add:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://clinic-backend-xxxx.onrender.com` (your Render URL)

3. Go to Deployments → Redeploy last deployment
4. Wait for deployment ✓

---

### ✅ STEP 3: Test (1 min)

1. Open your app: https://clinic-management-bzlmsyirc-omarhitman2010-6379s-projects.vercel.app
2. Login with:
   - Email: `admin@clinic.com`
   - Password: `password123`
3. Should see dashboard! ✓

---

## What You Get

✅ **Admin Dashboard** - KPIs, charts, system overview  
✅ **Patients** - Full CRUD, medical history  
✅ **Appointments** - Calendar, booking, scheduling  
✅ **Doctors** - Profiles, specialties, schedules  
✅ **Visits** - Diagnoses, prescriptions, vitals  
✅ **Billing** - Invoices, payments, reports  
✅ **Reports** - Analytics, revenue charts  
✅ **Patient Portal** - Self-service booking  
✅ **English/Arabic** - Full RTL support  

---

## Demo Accounts

Password: `password123`

- `admin@clinic.com` - Full access
- `doctor@clinic.com` - Doctor
- `layla@clinic.com` - Doctor (Pediatrics)
- `reception@clinic.com` - Receptionist
- `patient@clinic.com` - Patient portal

---

## Database Setup (if needed)

If tables aren't created:

1. Supabase → SQL Editor → New Query
2. Copy from: `server/database/supabase-setup.sql`
3. Paste and Run
4. Done! ✓

---

## Detailed Docs

- **`DEPLOYMENT.md`** - Full deployment guide with troubleshooting
- **`DATABASE_SETUP.md`** - Database setup instructions
- **`QUICK_START.md`** - Quick reference

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on login page | Backend not deployed yet - do Step 1 |
| Can't login | Wait 5 min for Render to start, refresh page |
| "Connection refused" | Backend still starting - check Render logs |
| API errors | Verify `VITE_API_URL` in Vercel is correct |

---

## Architecture

```
Browser
  ↓ (Vercel Frontend)
https://clinic-management-xxx.vercel.app
  ↓ (API Calls)
https://clinic-backend-xxx.onrender.com (Render Backend)
  ↓ (SQL)
db.ckhpfrlmrrjwmncougmq.supabase.co (Supabase DB)
```

---

**Ready? Start with Step 1 above! 🚀**

