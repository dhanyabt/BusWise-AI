-- BusWise AI Users Schema Migration
-- Table: users with RLS and index optimizations

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PASSENGER', 'OFFICER', 'POLICE')),
    agency VARCHAR(150),
    badge_number VARCHAR(50),
    token VARCHAR(128) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read on users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public registration insert on users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow user update on users" ON users FOR UPDATE USING (true);
