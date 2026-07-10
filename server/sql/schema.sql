-- ElderCare Management System - PostgreSQL Schema
-- Run: psql -U postgres -d eldercare_db -f schema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- 1. USERS / AUTH
-- =========================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'staff', 'family')) DEFAULT 'staff',
    contact_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    reset_token TEXT,
    reset_token_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 2. ELDERLY / RESIDENTS
-- =========================
CREATE TABLE IF NOT EXISTS residents (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    profile_photo TEXT,
    contact_number VARCHAR(20),
    emergency_contact VARCHAR(20),
    address TEXT,
    blood_group VARCHAR(5),
    date_of_admission DATE DEFAULT CURRENT_DATE,
    room_number VARCHAR(20),
    aadhaar_id VARCHAR(20),
    marital_status VARCHAR(20),
    guardian_info TEXT,
    occupation VARCHAR(150),
    status VARCHAR(20) CHECK (status IN ('Active', 'Discharged', 'Deceased')) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 3. MEDICAL RECORDS
-- =========================
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    medical_history TEXT,
    current_diseases TEXT,
    allergies TEXT,
    chronic_illnesses TEXT,
    current_medications TEXT,
    doctor_name VARCHAR(150),
    doctor_contact VARCHAR(20),
    hospital_name VARCHAR(150),
    vaccination_records TEXT,
    surgical_history TEXT,
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_documents (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    doc_type VARCHAR(50) CHECK (doc_type IN ('Lab Report', 'Prescription', 'Vaccination', 'Other')),
    file_name VARCHAR(255),
    file_path TEXT,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hospital_visits (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    reason TEXT,
    hospital_name VARCHAR(150),
    doctor_name VARCHAR(150),
    notes TEXT
);

-- =========================
-- 4. MEDICINE MANAGEMENT
-- =========================
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50),
    frequency VARCHAR(50),
    time_schedule VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    stock_available INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medicine_logs (
    id SERIAL PRIMARY KEY,
    medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) CHECK (status IN ('Taken', 'Missed', 'Pending')) DEFAULT 'Pending',
    marked_by INT REFERENCES users(id),
    marked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(medicine_id, log_date)
);

-- =========================
-- 5. HEALTH MONITORING
-- =========================
CREATE TABLE IF NOT EXISTS health_records (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    blood_pressure VARCHAR(20),
    blood_sugar NUMERIC(6,2),
    body_temperature NUMERIC(5,2),
    pulse_rate INT,
    spo2 INT,
    weight NUMERIC(6,2),
    height NUMERIC(6,2),
    bmi NUMERIC(5,2),
    notes TEXT,
    recorded_by INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 6. FAMILY PORTAL
-- =========================
CREATE TABLE IF NOT EXISTS family_links (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    relationship VARCHAR(50),
    UNIQUE(user_id, resident_id)
);

CREATE TABLE IF NOT EXISTS visit_schedules (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    family_user_id INT REFERENCES users(id),
    visit_date DATE NOT NULL,
    visit_time TIME,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'Scheduled',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    sender_id INT REFERENCES users(id),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id),
    resident_id INT REFERENCES residents(id),
    title VARCHAR(150),
    body TEXT,
    type VARCHAR(30) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 7. STAFF MANAGEMENT
-- =========================
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    designation VARCHAR(100),
    contact_number VARCHAR(20),
    email VARCHAR(150),
    address TEXT,
    date_joined DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_attendance (
    id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) CHECK (status IN ('Present', 'Absent', 'On Leave', 'Half Day')) DEFAULT 'Present',
    UNIQUE(staff_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS staff_shifts (
    id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(20) CHECK (shift_type IN ('Morning', 'Evening', 'Night')),
    start_time TIME,
    end_time TIME
);

CREATE TABLE IF NOT EXISTS staff_leaves (
    id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_tasks (
    id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    resident_id INT REFERENCES residents(id),
    task_description TEXT NOT NULL,
    due_date DATE,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'In Progress', 'Completed')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_care_notes (
    id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    note_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_activity_logs (
    id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    activity TEXT NOT NULL,
    logged_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 8. APPOINTMENTS (Dashboard/Reports support)
-- =========================
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    resident_id INT NOT NULL REFERENCES residents(id) ON DELETE CASCADE,
    doctor_name VARCHAR(150),
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    purpose TEXT,
    status VARCHAR(20) DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- 9. FINANCIAL RECORDS (basic, for Reports module)
-- =========================
CREATE TABLE IF NOT EXISTS financial_records (
    id SERIAL PRIMARY KEY,
    resident_id INT REFERENCES residents(id),
    record_type VARCHAR(20) CHECK (record_type IN ('Income', 'Expense')),
    category VARCHAR(100),
    amount NUMERIC(10,2) NOT NULL,
    record_date DATE DEFAULT CURRENT_DATE,
    notes TEXT
);

-- =========================
-- 10. ROOMS (supports Dashboard occupied/vacant stats)
-- =========================
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(20) UNIQUE NOT NULL,
    capacity INT DEFAULT 1,
    is_occupied BOOLEAN DEFAULT FALSE
);

-- Indexes for search & filter performance
CREATE INDEX IF NOT EXISTS idx_residents_name ON residents (full_name);
CREATE INDEX IF NOT EXISTS idx_residents_room ON residents (room_number);
CREATE INDEX IF NOT EXISTS idx_residents_blood_group ON residents (blood_group);
CREATE INDEX IF NOT EXISTS idx_residents_gender ON residents (gender);
CREATE INDEX IF NOT EXISTS idx_medical_disease ON medical_records (current_diseases);

-- Seed default admin user (password: Admin@123 - CHANGE AFTER FIRST LOGIN)
-- Password hash generated with bcrypt, rounds=10
-- Run node server/seed.js instead if you prefer generating fresh hash
