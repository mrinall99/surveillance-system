-- ============================================================
-- Government-Grade Surveillance System Database Schema (SQLite)
-- ============================================================

-- Admin User Credentials Table
CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    failed_attempts INTEGER DEFAULT 0,
    locked_until DATETIME,
    must_change_pw BOOLEAN DEFAULT 0
);

-- Authentication Audit Logs Table
CREATE TABLE IF NOT EXISTS auth_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    action TEXT NOT NULL, -- 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'LOCKOUT', 'SETUP'
    ip_address TEXT,
    user_agent TEXT,
    details TEXT
);

-- Surveillance Detections & Threats Event Logs Table
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    camera_id INTEGER NOT NULL,
    threat_level TEXT NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    object_class TEXT NOT NULL,
    confidence REAL NOT NULL,
    track_id INTEGER DEFAULT -1,
    zone_name TEXT,
    snapshot_path TEXT,
    recording_path TEXT,
    metadata TEXT -- JSON object with full detection payload
);

-- Polygonal Restricted & Monitored Zones Table
CREATE TABLE IF NOT EXISTS zones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL, -- 'restricted', 'monitored', 'safe'
    polygon TEXT NOT NULL, -- JSON array of points [[x, y], ...]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Active Camera Sources Table
CREATE TABLE IF NOT EXISTS cameras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source TEXT NOT NULL,
    resolution TEXT DEFAULT '640x480',
    fps INTEGER DEFAULT 20,
    status TEXT DEFAULT 'active'
);
