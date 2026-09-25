# ⚡ 09. Supabase Cloud Database Integration & Setup Guide

---

## 🎯 Architectural Overview
Our surveillance system has been **100% migrated to Supabase Cloud PostgreSQL**.

The local `surveillance.json` database file has been removed, and the Node.js backend now communicates directly with Supabase Cloud PostgreSQL tables via `@supabase/supabase-js`.

### 🗄️ Database Tables in Supabase Cloud
1. **`admin`**: User accounts, roles, and salted `Bcrypt` password hashes.
2. **`zones`**: Spatial security zone polygon coordinates (`[[x1,y1], [x2,y2], ...]`).
3. **`events`**: Live AI threat detection alert logs (timestamp, object class, confidence, track_id).
4. **`cameras`**: Active camera feeds and RTSP stream sources.
5. **`auth_logs`**: Forensic audit trail of user login attempts.

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Create a Free Supabase Project (3 Minutes)
1. Go to [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign in with GitHub or email (100% free).
3. Click **New Project**, name it `hawkeye-surveillance`, set a database password, and click **Create new project**.

---

### Step 2: Run SQL Schema & Disable RLS
1. In your Supabase dashboard sidebar, click the **SQL Editor** tab (`>_`).
2. Open [`server/src/db/supabase_schema.sql`](file:///c:/Users/mrina/Documents/surveillance%20system/server/src/db/supabase_schema.sql) in VS Code, copy all contents, and paste them into the SQL Editor.
3. Click **RUN** (top right).
4. All 5 tables (`admin`, `zones`, `events`, `cameras`, `auth_logs`) will be created, default admin seeded (`hitman009`), and **Row-Level Security (RLS)** disabled so your backend API key can insert live event telemetry freely!

---

### Step 3: Get Your Supabase API Credentials
1. In your Supabase dashboard sidebar, go to **Project Settings** (gear icon ⚙️) → **API**.
2. Copy the following two parameters:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** (e.g., `eyJhbGciOi...`)

---

### Step 4: Configure `server/.env`
Create or edit your `server/.env` file:

```env
PORT=5000
JWT_SECRET=super_secret_surveillance_jwt_key_2026

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-public-key-here
```

---

### Step 5: Start Server & Verify Cloud Connection
Start your Node.js backend:
```bash
cd server
npm start
```

You will see the startup confirmation log:
```
⚡ Connected to Supabase Cloud PostgreSQL Database: https://your-project-ref.supabase.co
```

---

## 💡 Row-Level Security (RLS) & Common Troubleshooting

### Fix: `new row violates row-level security policy for table "events"`
If you ever see an RLS error in the server console, run this command in your Supabase SQL Editor:
```sql
ALTER TABLE public.admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs DISABLE ROW LEVEL SECURITY;
```

---

## 🎓 How to Answer Examiners in Your Viva

If your professor asks: *"Which database management system are you using?"*

> **Winning Answer**:  
> *"We use **Supabase Cloud PostgreSQL** as our enterprise production database.  
> Our Node.js backend uses `@supabase/supabase-js` to store security threat alerts, spatial security zones, and user credentials.  
> It provides high-performance SQL indexing, real-time subscription capabilities, and encrypted cloud persistence."*
