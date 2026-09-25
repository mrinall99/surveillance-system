# ⚡ 09. Supabase Cloud Database Shift & Integration Guide

---

## 🎯 Overview
Our system now supports **Dual Database Architecture (Hybrid Mode)**:
1. **Supabase Cloud Mode**: Uses real cloud-hosted PostgreSQL with instantaneous cloud synchronization when `.env` credentials are present.
2. **Local JSON Mode**: Seamlessly falls back to `server/data/surveillance.json` if offline or running locally without internet.

This gives you the **ultimate presentation advantage** for your college viva:
- You can demonstrate real cloud PostgreSQL database integration via Supabase.
- You are 100% safe against internet drops during live college demos!

---

## 🛠️ Step-by-Step Setup Guide to Activate Supabase

### Step 1: Create a Free Supabase Project (3 Minutes)
1. Go to [https://supabase.com](https://supabase.com) and click **Start your project**.
2. Sign in with GitHub or email (100% free).
3. Click **New Project**, name it `hawkeye-surveillance`, enter a password, and click **Create new project**.

---

### Step 2: Create Tables via SQL Editor
1. In your Supabase dashboard sidebar, click the **SQL Editor** tab (icon `>_`).
2. Open [`server/src/db/supabase_schema.sql`](file:///c:/Users/mrina/Documents/surveillance%20system/server/src/db/supabase_schema.sql) in VS Code, copy all contents, and paste them into the Supabase SQL Editor.
3. Click **RUN** (top right).
4. You will see `Success: No rows returned`. All 5 tables (`admin`, `zones`, `events`, `cameras`, `auth_logs`) and indexes are created!

---

### Step 3: Get Your API Credentials
1. In your Supabase dashboard, go to **Project Settings** (gear icon ⚙️) → **API**.
2. Copy the following two strings:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **anon / public key** (e.g., `eyJhbGciOi...`)

---

### Step 4: Configure `server/.env`
Create a `.env` file in the `server/` directory (or edit existing `server/.env`) and paste:

```env
PORT=5000
JWT_SECRET=super_secret_surveillance_jwt_key_2026

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-public-key-here
```

---

### Step 5: Start Server & Verify
Restart your Node.js backend:
```bash
cd server
npm run dev
```

You will see the startup confirmation log:
```
⚡ Connected to Supabase Cloud PostgreSQL Database: https://your-project-ref.supabase.co
```

---

## 🎓 How to Answer Examiners in Your Viva

If your professor asks: *"What database are you using, and is it cloud-ready?"*

> **Winning Answer**:  
> *"Our architecture features a **Hybrid Dual-Database System**.  
> We use **Supabase Cloud PostgreSQL** as our primary cloud database, hosting tables for security telemetry, spatial polygon zones, user authentication, and audit logs.  
> We also implemented an **offline fallback driver** (`surveillance.json`) so the system can operate on local edge hardware without requiring an internet connection."*
