# Deploy Clinic Management System

## Option 1: Quick Setup (Frontend on Vercel + Backend on Render)

### Step 1: Deploy Backend to Render (5 min)

1. Go to https://render.com and sign up
2. Click "New +" → "Web Service"
3. Select "Public Git repository" and enter:
   ```
   https://github.com/OmarAdeel/clinic-management
   ```
   (or your repo URL)

4. Configure the service:
   - **Name:** clinic-backend
   - **Branch:** main
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Instance Type:** Free

5. Click "Advanced" and add Environment Variables:
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
7. Wait for deployment (5-10 min)
8. Copy the URL (e.g., `https://clinic-backend-xxxx.onrender.com`)

### Step 2: Link Frontend to Backend (2 min)

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add new variable:
   - **Name:** `VITE_API_URL`
   - **Value:** `https://clinic-backend-xxxx.onrender.com` (replace xxxx with your Render URL)

3. Click "Add"
4. Go to Deployments → Redeploy (click the last deployment → "Redeploy")
5. Wait for redeployment

### Step 3: Test

Open https://clinic-management-bzlmsyirc-omarhitman2010-6379s-projects.vercel.app
- Login with `admin@clinic.com` / `password123`
- Should see dashboard data

---

## Option 2: Full Monorepo on Vercel (Advanced)

Convert Express to Vercel Functions and deploy everything as one project.

**Steps:**
1. Create `/api` folder at project root
2. Convert Express routes to serverless functions
3. Push to GitHub
4. Vercel auto-detects and deploys both

Contact if you want help with this option.

---

## Troubleshooting

**404 errors on frontend:**
- Check Vercel env var is set: `VITE_API_URL`
- Verify backend URL is correct and deployed
- Clear browser cache and hard refresh

**Backend not connecting to database:**
- Verify Supabase credentials are correct
- Check network connectivity: `curl https://db.ckhpfrlmrrjwmncougmq.supabase.co:5432`

**"Connection refused" errors:**
- Wait 5-10 min for Render to fully start the service
- Check Render logs for startup errors

---

## Production Checklist

- [ ] Backend deployed to Render
- [ ] Frontend API URL configured in Vercel
- [ ] Database tables created in Supabase
- [ ] Demo accounts working (admin@clinic.com)
- [ ] All API endpoints responding
- [ ] CORS configured correctly
- [ ] SSL/HTTPS working on both

