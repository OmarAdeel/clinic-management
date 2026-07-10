-- Clinic Management System - PostgreSQL Schema

-- Drop tables if they exist
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctor_schedules CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
DROP TYPE IF EXISTS invoice_status CASCADE;
DROP TYPE IF EXISTS payment_method CASCADE;
DROP TYPE IF EXISTS patient_gender CASCADE;

-- Create custom enum types
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'receptionist', 'patient');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE invoice_status AS ENUM ('draft', 'unpaid', 'partial', 'paid', 'cancelled');
CREATE TYPE payment_method AS ENUM ('cash', 'card', 'transfer', 'insurance');
CREATE TYPE patient_gender AS ENUM ('male', 'female');

-- Create function to auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          user_role NOT NULL DEFAULT 'receptionist',
  phone         VARCHAR(30)  NULL,
  avatar        VARCHAR(255) NULL,
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- doctors
-- ---------------------------------------------------------------------------
CREATE TABLE doctors (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER NOT NULL UNIQUE,
  specialty        VARCHAR(120) NOT NULL,
  bio              TEXT         NULL,
  consultation_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  color            VARCHAR(9)   NOT NULL DEFAULT '#0d9488',
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TRIGGER update_doctors_modtime
    BEFORE UPDATE ON doctors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- doctor_schedules
-- ---------------------------------------------------------------------------
CREATE TABLE doctor_schedules (
  id           SERIAL PRIMARY KEY,
  doctor_id    INTEGER NOT NULL,
  day_of_week  SMALLINT NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  slot_minutes SMALLINT NOT NULL DEFAULT 30,
  CONSTRAINT fk_schedules_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
  CONSTRAINT uq_doctor_day UNIQUE (doctor_id, day_of_week, start_time)
);

-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------
CREATE TABLE patients (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER NULL UNIQUE,
  full_name     VARCHAR(150) NOT NULL,
  dob           DATE         NULL,
  gender        patient_gender NULL,
  phone         VARCHAR(30)  NULL,
  email         VARCHAR(190) NULL,
  address       VARCHAR(255) NULL,
  blood_type    VARCHAR(5)   NULL,
  allergies     TEXT         NULL,
  medical_notes TEXT         NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_patients_name ON patients(full_name);
CREATE INDEX idx_patients_phone ON patients(phone);

CREATE TRIGGER update_patients_modtime
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- appointments
-- ---------------------------------------------------------------------------
CREATE TABLE appointments (
  id         SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL,
  doctor_id  INTEGER NOT NULL,
  date       DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  status     appointment_status NOT NULL DEFAULT 'scheduled',
  reason     VARCHAR(255) NULL,
  created_by INTEGER NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_appt_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_appt_doctor  FOREIGN KEY (doctor_id)  REFERENCES doctors(id)  ON DELETE CASCADE,
  CONSTRAINT fk_appt_creator FOREIGN KEY (created_by) REFERENCES users(id)    ON DELETE SET NULL
);

CREATE INDEX idx_appt_date ON appointments(date);
CREATE INDEX idx_appt_doctor_date ON appointments(doctor_id, date);

CREATE TRIGGER update_appointments_modtime
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- visits
-- ---------------------------------------------------------------------------
CREATE TABLE visits (
  id             SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL UNIQUE,
  diagnosis      TEXT NULL,
  symptoms       TEXT NULL,
  notes          TEXT NULL,
  vitals         JSONB NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_visits_appt FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE
);

CREATE TRIGGER update_visits_modtime
    BEFORE UPDATE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- prescriptions
-- ---------------------------------------------------------------------------
CREATE TABLE prescriptions (
  id           SERIAL PRIMARY KEY,
  visit_id     INTEGER NOT NULL,
  medication   VARCHAR(190) NOT NULL,
  dosage       VARCHAR(100) NULL,
  frequency    VARCHAR(100) NULL,
  duration     VARCHAR(100) NULL,
  instructions VARCHAR(255) NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rx_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
CREATE TABLE invoices (
  id             SERIAL PRIMARY KEY,
  invoice_number VARCHAR(30) NOT NULL UNIQUE,
  patient_id     INTEGER NOT NULL,
  appointment_id INTEGER NULL,
  subtotal       DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax            DECIMAL(10,2) NOT NULL DEFAULT 0,
  total          DECIMAL(10,2) NOT NULL DEFAULT 0,
  status         invoice_status NOT NULL DEFAULT 'unpaid',
  created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_appt    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);

CREATE INDEX idx_inv_status ON invoices(status);

CREATE TRIGGER update_invoices_modtime
    BEFORE UPDATE ON invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- invoice_items
-- ---------------------------------------------------------------------------
CREATE TABLE invoice_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INTEGER NOT NULL,
  description VARCHAR(255) NOT NULL,
  qty         SMALLINT NOT NULL DEFAULT 1,
  unit_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount      DECIMAL(10,2) NOT NULL DEFAULT 0,
  CONSTRAINT fk_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
CREATE TABLE payments (
  id          SERIAL PRIMARY KEY,
  invoice_id  INTEGER NOT NULL,
  amount      DECIMAL(10,2) NOT NULL,
  method      payment_method NOT NULL DEFAULT 'cash',
  paid_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  received_by INTEGER NULL,
  CONSTRAINT fk_pay_invoice  FOREIGN KEY (invoice_id)  REFERENCES invoices(id) ON DELETE CASCADE,
  CONSTRAINT fk_pay_receiver FOREIGN KEY (received_by) REFERENCES users(id)    ON DELETE SET NULL
);
