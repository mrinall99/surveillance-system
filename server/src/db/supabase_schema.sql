-- ========================================================
-- HawkEye AI Surveillance System — Supabase SQL Schema
-- Copy and paste this script into your Supabase SQL Editor
-- (https://supabase.com/dashboard/project/_/sql)
-- ========================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.admin (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    must_change_pw INT DEFAULT 0
);

-- 2. Create Spatial Security Zones Table
CREATE TABLE IF NOT EXISTS public.zones (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) DEFAULT 'restricted',
    polygon TEXT NOT NULL, -- JSON string of coordinates: [[x1,y1],[x2,y2],...]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create AI Threat Events Table
CREATE TABLE IF NOT EXISTS public.events (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    camera_id INT DEFAULT 1,
    threat_level VARCHAR(50) NOT NULL, -- 'CRITICAL', 'WARNING', 'INFO'
    object_class VARCHAR(100) NOT NULL, -- 'person', 'car', 'motorcycle', etc.
    confidence FLOAT NOT NULL,
    track_id INT DEFAULT 0,
    zone_name VARCHAR(150),
    metadata TEXT
);

-- 4. Create Cameras Table
CREATE TABLE IF NOT EXISTS public.cameras (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    source VARCHAR(255) NOT NULL, -- '0', RTSP URL, or .mp4 path
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Auth Logs Audit Table
CREATE TABLE IF NOT EXISTS public.auth_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    ip_address VARCHAR(100),
    user_agent TEXT,
    details TEXT
);

-- Disable Row Level Security (RLS) so our backend can insert & read events freely
ALTER TABLE public.admin DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cameras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs DISABLE ROW LEVEL SECURITY;

-- Indexes for high-performance dashboard query execution
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON public.events(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_threat_level ON public.events(threat_level);
CREATE INDEX IF NOT EXISTS idx_admin_username ON public.admin(username);

-- Seed Default Admin User (username: hitman009)
INSERT INTO public.admin (username, password_hash)
VALUES ('hitman009', '$2a$12$uA8bG9mJ/QD2gikXzDexguAeP4hanIpeHa/W5Xr.8sR67Zgrk2.WC')
ON CONFLICT (username) DO NOTHING;

-- Seed Default Spatial Zones
INSERT INTO public.zones (name, type, polygon)
VALUES 
    ('Restricted Main Zone', 'restricted', '[[10,10],[50,10],[50,80],[10,80]]'),
    ('Monitored Perimeter', 'monitored', '[[55,10],[90,10],[90,90],[55,90]]')
ON CONFLICT DO NOTHING;
