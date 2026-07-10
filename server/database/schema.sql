-- Clinic Management System - PostgreSQL Schema (Supabase)
-- Run once: psql "connection-string" -f schema.sql

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS payments         CASCADE;
DROP TABLE IF EXISTS invoice_items    CASCADE;
DROP TABLE IF EXISTS invoices         CASCADE;
DROP TABLE IF EXISTS prescriptions    CASCADE;
DROP TABLE IF EXISTS visits           CASCADE;
DROP TABLE IF EXISTS appointments     CASCADE;
DROP TABLE IF EXISTS doctor_schedules CASCADE;
DROP TABLE IF EXISTS doctors          CASCADE;
DROP TABLE IF EXISTS patients         CASCADE;
DROP TABLE IF EXISTS users            CASCADE;

-- Note: Using VARCHAR constraints instead of custom ENUMs for pooler compatibility.
-- Valid values are enforced at the application layer.

-- users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'receptionist'
                  CHECK (role IN ('admin','doctor','receptionist','patient')),
  phone         VARCHAR(30),
  avatar        VARCHAR(255),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- doctors
CREATE TABLE IF NOT EXISTS doctors (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  specialty        VARCHAR(120) NOT NULL,
  bio              TEXT,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  color            VARCHAR(9)    NOT NULL DEFAULT '#0d9488',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- doctor_schedules (0=Sun … 6=Sat)
CREATE TABLE IF NOT EXISTS doctor_schedules (
  id           SERIAL PRIMARY KEY,
  doctor_id    INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  slot_minutes SMALLINT NOT NULL DEFAULT 30,
  UNIQUE (doctor_id, day_of_week, start_time)
);

-- patients
CREATE TABLE IF NOT EXISTS patients (
  id            SERIAL PRIMARY KEY,
  user_id       INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  full_name     VARCHAR(150) NOT NULL,
  dob           DATE,
  gender        VARCHAR(10)  CHECK (gender IN ('male','female')),
  phone         VARCHAR(30),
  email         VARCHAR(190),
  address       VARCHAR(255),
  blood_type    VARCHAR(5),
  allergies     TEXT,
  medical_notes TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_patients_name  ON patients (full_name);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients (phone);

-- appointments
CREATE TABLE IF NOT EXISTS appointments (
  id         SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id  INT NOT NULL REFERENCES doctors(id)  ON DELETE CASCADE,
  date       DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'scheduled'
               CHECK (status IN ('scheduled','confirmed','completed','cancelled','no_show')),
  reason     VARCHAR(255),
  created_by INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_appt_date        ON appointments (date);
CREATE INDEX IF NOT EXISTS idx_appt_doctor_date ON appointments (doctor_id, date);

-- visits
CREATE TABLE IF NOT EXISTS visits (
  id             SERIAL PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  diagnosis      TEXT,
  symptoms       TEXT,
  notes          TEXT,
  vitals         JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
  id           SERIAL PRIMARY KEY,
  visit_id     INT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  medication   VARCHAR(190) NOT NULL,
  dosage       VARCHAR(100),
  frequency    VARCHAR(100),
  duration     VARCHAR(100),
  instructions VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invoices
CREATE TABLE IF NOT EXISTS invoices (
  id             SERIAL PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  patient_id     INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id INT REFERENCES appointments(id) ON DELETE SET NULL,
  subtotal       NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount       NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax            NUMERIC(10,2) NOT NULL DEFAULT 0,
  total          NUMERIC(10,2) NOT NULL DEFAULT 0,
  status         VARCHAR(20) NOT NULL DEFAULT 'unpaid'
                   CHECK (status IN ('draft','unpaid','partial','paid','cancelled')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inv_status ON invoices (status);

-- invoice_items
CREATE TABLE IF NOT EXISTS invoice_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  qty         SMALLINT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount      NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- payments
CREATE TABLE IF NOT EXISTS payments (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL,
  method      VARCHAR(20) NOT NULL DEFAULT 'cash'
                CHECK (method IN ('cash','card','transfer','insurance')),
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by INT REFERENCES users(id) ON DELETE SET NULL
);
