# Deploy to Vercel (Full Stack)

Your Clinic Management System is now configured for full-stack deployment on Vercel with:
- React frontend (Vite)
- Express serverless API functions
- PostgreSQL database on Supabase

## Step 1: Database Setup (One-time)

Copy the entire content of `server/database/supabase-setup.sql` and run it in your Supabase SQL Editor:
1. Go to https://supabase.com/dashboard → SQL Editor
2. Click "New Query"
3. Paste the SQL file content
4. Click "Run"

Your database now has all 10 tables with seed data.

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Add Vercel deployment configuration"
git push origin main
```

## Step 3: Deploy on Vercel

### Option A: Connect GitHub (Recommended)
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Click "Import"

### Option B: CLI Deploy
```bash
npm install -g vercel
vercel --prod
```

## Step 4: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DB_HOST=db.ckhpfrlmrrjwmncougmq.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=#9v5ZpglbBl
DB_NAME=postgres
JWT_SECRET=cLInIcMgMt_s3cr3t_2026_xZ9pQ!
JWT_EXPIRES_IN=12h
CLIENT_ORIGIN=https://your-vercel-url.vercel.app
```

Then redeploy:
```bash
vercel --prod
```

## Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Login with: admin@clinic.com / password123
3. Dashboard should load with real data ✓

## API Endpoints

All endpoints are available at `https://your-vercel-url.vercel.app/api/`

- `POST /api/auth/login` - Login
- `GET /api/health` - Health check
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- And 25+ more endpoints...

## Troubleshooting

### Build Fails
- Check that `client/package.json` exists
- Ensure `npm run build` works locally: `cd client && npm install && npm run build`

### API Returns 404
- Verify environment variables are set in Vercel
- Check that DB connection string is correct
- Verify JWT_SECRET is set

### Database Connection Error
- Confirm Supabase credentials in environment variables
- Check that database tables exist: run `supabase-setup.sql` again
- Test connection locally: `node api/lib/db.js`

## Local Development

Run both frontend and backend locally:

```bash
# Terminal 1: Frontend
cd client
npm install
npm run dev

# Terminal 2: Backend (optional - frontend uses /api)
vercel dev
```

Access at http://localhost:5173

## File Structure

```
/
├── api/                          # Vercel serverless functions
│   ├── health.js
│   ├── auth/[action].js
│   ├── patients/[action].js
│   ├── doctors/[action].js
│   ├── appointments/[action].js
│   ├── visits/[action].js
│   ├── billing/[action].js
│   ├── reports/[action].js
│   ├── portal/[action].js
│   └── lib/                      # Shared utilities
│       ├── env.js
│       ├── db.js
│       ├── auth.js
│       ├── middleware.js
│       ├── helpers.js
│       └── controllers/          # Business logic
├── client/                       # React frontend
│   ├── src/
│   ├── index.html
│   └── vite.config.js
├── server/                       # Original Express server (for reference)
├── vercel.json                   # Vercel configuration
└── package.json
```

## Performance Notes

- Serverless functions have 30s timeout (adjustable in vercel.json)
- Database connections pool (max 5 concurrent)
- Frontend is built as static SPA for instant CDN delivery
- All requests to `/api` route to serverless functions

Your app is production-ready! 🚀
