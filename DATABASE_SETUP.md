# Database Setup Guide - Clinic Management System

## Quick Setup (2 minutes)

### Step 1: Go to Supabase SQL Editor
1. Log into your Supabase project: https://supabase.com/dashboard
2. Click **SQL Editor** (left sidebar)
3. Click **New Query** (top right)

### Step 2: Copy the Setup SQL
1. Open the file: `server/database/supabase-setup.sql`
2. Copy ALL the code (Ctrl+A → Ctrl+C)
3. Paste it into the Supabase SQL Editor

### Step 3: Run the Script
1. Click the **Run** button (or press Ctrl+Enter)
2. Wait for completion (30-60 seconds)
3. You'll see: `10 tables created, 70+ rows inserted`

---

## What Gets Created

### Tables (10 total)
- `users` - 5 demo accounts (admin, 2 doctors, receptionist, patient)
- `doctors` - 2 specialists (General Medicine, Pediatrics)
- `doctor_schedules` - 10 weekly availability slots
- `patients` - 10 patient records with medical history
- `appointments` - 16 appointments (past/today/future)
- `visits` - 7 completed visits with diagnoses
- `prescriptions` - 6 medications
- `invoices` - 7 billing records
- `invoice_items` - 10 line items
- `payments` - 5 payment records

### Demo Accounts
All use password: `password123`

| Email | Role |
|-------|------|
| admin@clinic.com | Admin |
| doctor@clinic.com | Doctor (General Medicine) |
| layla@clinic.com | Doctor (Pediatrics) |
| reception@clinic.com | Receptionist |
| patient@clinic.com | Patient |

---

## Verify Setup Worked

After running the script, run this test query in a new SQL Editor tab:

```sql
SELECT 
  (SELECT COUNT(*) FROM users) as users_count,
  (SELECT COUNT(*) FROM patients) as patients_count,
  (SELECT COUNT(*) FROM appointments) as appointments_count,
  (SELECT COUNT(*) FROM invoices) as invoices_count;
```

Expected result:
```
users_count: 5
patients_count: 10
appointments_count: 16
invoices_count: 7
```

---

## Backend Connection

The backend is already configured to connect to your Supabase project:

**File:** `server/.env`
```
DB_HOST=db.ckhpfrlmrrjwmncougmq.supabase.co
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=#9v5ZpglbBl
DB_NAME=postgres
```

No changes needed - just run the frontend and backend locally:

```bash
# Terminal 1
cd server
npm install
npm run dev

# Terminal 2
cd client
npm install
npm run dev
```

Then open http://localhost:5173 and login with demo accounts above.

---

## Troubleshooting

### "Table already exists"
- Run the script again - it uses `DROP TABLE IF EXISTS`, so it's safe to re-run
- This will reset all data back to the demo dataset

### "Foreign key constraint fails"
- Make sure you're running the ENTIRE script in one go, not line by line
- The tables must be created in the correct order (users → doctors → appointments, etc.)

### "Can't see tables in Table Editor"
- Click the refresh icon (circular arrow) in the Table Editor left panel
- Tables should appear under the `public` schema

### Backend connection error
- Verify your `.env` file has the correct credentials (copy from dashboard)
- Make sure your Supabase project is in the same region as `db.ckhpfrlmrrjwmncougmq`

---

## Next Steps

1. ✅ Copy and paste `supabase-setup.sql` into Supabase SQL Editor
2. ✅ Run the script and verify (should take 30-60 seconds)
3. ✅ Clone/download this repo
4. ✅ Run `cd server && npm install && npm run dev`
5. ✅ Run `cd client && npm install && npm run dev`
6. ✅ Open http://localhost:5173 and login

The full clinic management system will now be live with all demo data!
