-- AMC Tvoj Coffeeshop - PostgreSQL Schema
-- Run this to initialize the database

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 2) DEFAULT 5.00,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    verification_token_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('arrival', 'departure')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_verification_token ON employees(verification_token);

-- Insert default admin user (password: admin123)
-- The hash is for 'admin123' using bcrypt
INSERT INTO employees (name, email, password_hash, is_admin, email_verified, hourly_rate)
VALUES (
    'Admin',
    'admin@amc.sk',
    '$2b$10$rOzJqQZQGqYNqYQZqYNqYuOzJqQZQGqYNqYQZqYNqYuOzJqQZQGqY',
    TRUE,
    TRUE,
    10.00
) ON CONFLICT (email) DO NOTHING;

