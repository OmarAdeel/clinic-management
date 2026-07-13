-- Clinic Management System - Migrations (PostgreSQL)
-- Additive schema changes that extend the base schema.pg.sql with:
--   * Soft-delete on patients / appointments / invoices / users
--   * Services catalog (for billing line items)
--   * Doctor leave / time-off blocking
--   * Lab tests & results
--   * Insurance providers and claims
--   * Payments: (already in base) — extended with refund notes
--   * Audit log
--   * Clinics settings (single-row clinic profile for printable headers)
--
-- Safe to re-run: each block is idempotent (IF NOT EXISTS / DO blocks).

-- ---------------------------------------------------------------------------
-- 1. Soft-delete columns
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE patients      ADD COLUMN deleted_at TIMESTAMP NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE appointments ADD COLUMN deleted_at TIMESTAMP NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE invoices     ADD COLUMN deleted_at TIMESTAMP NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE users        ADD COLUMN deleted_at TIMESTAMP NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 2. Clinic profile (single-row) — used for printable headers / branding
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE clinic_settings (
    id            SMALLINT PRIMARY KEY DEFAULT 1,
    name          VARCHAR(150) NOT NULL DEFAULT 'Clinic',
    address       VARCHAR(255) NULL,
    phone         VARCHAR(30)  NULL,
    email         VARCHAR(190) NULL,
    tax_id        VARCHAR(60)  NULL,
    logo_url      VARCHAR(255) NULL,
    CONSTRAINT only_one_row CHECK (id = 1)
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

INSERT INTO clinic_settings (id, name)
VALUES (1, 'Springfield Clinic')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 3. Services catalog (priced items that can be pulled into invoices)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE service_category AS ENUM ('consultation','procedure','lab','imaging','medicine','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE services (
    id          SERIAL PRIMARY KEY,
    code        VARCHAR(40) NULL,
    name        VARCHAR(190) NOT NULL,
    category    service_category NOT NULL DEFAULT 'other',
    unit_price  DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_services_code UNIQUE (code)
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 4. Doctor leave / time-off blocking (per-day overrides)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE doctor_leave (
    id          SERIAL PRIMARY KEY,
    doctor_id   INTEGER NOT NULL,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    reason      VARCHAR(255) NULL,
    created_by  INTEGER NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_leave_doctor FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    CONSTRAINT fk_leave_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_leave_doctor_dates ON doctor_leave(doctor_id, start_date, end_date);

-- ---------------------------------------------------------------------------
-- 5. Lab tests catalog and ordered lab tests (attached to a visit)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE lab_catalog (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(190) NOT NULL,
    specimen      VARCHAR(80) NULL,
    reference_range VARCHAR(190) NULL,
    unit          VARCHAR(40) NULL,
    price         DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lab_status AS ENUM ('ordered','collected','resulted','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE lab_tests (
    id            SERIAL PRIMARY KEY,
    visit_id       INTEGER NOT NULL,
    patient_id    INTEGER NOT NULL,
    test_name     VARCHAR(190) NOT NULL,
    specimen      VARCHAR(80) NULL,
    result_value  VARCHAR(190) NULL,
    unit          VARCHAR(40) NULL,
    reference_range VARCHAR(190) NULL,
    abnormal      BOOLEAN NULL,
    status        lab_status NOT NULL DEFAULT 'ordered',
    ordered_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resulted_at   TIMESTAMP NULL,
    notes         TEXT NULL,
    CONSTRAINT fk_lab_visit FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
    CONSTRAINT fk_lab_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_lab_patient ON lab_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_visit ON lab_tests(visit_id);

-- ---------------------------------------------------------------------------
-- 6. Insurance providers and claims
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE insurance_providers (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(190) NOT NULL,
    contact_phone VARCHAR(30) NULL,
    contact_email VARCHAR(190) NULL,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE patients ADD COLUMN insurance_provider_id INTEGER NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE patients ADD COLUMN insurance_number VARCHAR(60) NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  -- Drop existing FK if it exists, then (re)create
  ALTER TABLE patients DROP CONSTRAINT IF EXISTS fk_patients_insurance;
  ALTER TABLE patients
    ADD CONSTRAINT fk_patients_insurance
    FOREIGN KEY (insurance_provider_id) REFERENCES insurance_providers(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE claim_status AS ENUM ('draft','submitted','approved','rejected','paid','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE insurance_claims (
    id           SERIAL PRIMARY KEY,
    claim_number VARCHAR(40) NOT NULL,
    invoice_id   INTEGER NULL,
    patient_id   INTEGER NOT NULL,
    provider_id  INTEGER NOT NULL,
    amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
    status       claim_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP NULL,
    notes        TEXT NULL,
    created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_claim_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
    CONSTRAINT fk_claim_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_claim_provider FOREIGN KEY (provider_id) REFERENCES insurance_providers(id) ON DELETE CASCADE,
    CONSTRAINT uq_claim_number UNIQUE (claim_number)
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 7. Audit log
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TABLE audit_logs (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NULL,
    user_name   VARCHAR(150) NULL,
    role        VARCHAR(20) NULL,
    action      VARCHAR(40) NOT NULL,  -- 'create' | 'update' | 'delete' | 'auth.login' etc.
    entity      VARCHAR(60) NULL,
    entity_id   VARCHAR(40) NULL,
    details     JSONB NULL,
    ip_address  VARCHAR(60) NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);

-- ---------------------------------------------------------------------------
-- 8. Indexes for soft-delete-aware queries
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_patients_active ON patients(deleted_at);
CREATE INDEX IF NOT EXISTS idx_appointments_active ON appointments(deleted_at);

-- ---------------------------------------------------------------------------
-- 9. Appointment reminders track
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE appointments ADD COLUMN reminder_sent_at TIMESTAMP NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_appt_reminder
  ON appointments(date, start_time)
  WHERE reminder_sent_at IS NULL;

-- ---------------------------------------------------------------------------
-- 10. Notifications outbound log (email/SMS) - idempotent delivery recording
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE notification_channel AS ENUM ('email','sms','in_app');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TABLE notifications (
    id          SERIAL PRIMARY KEY,
    recipient   VARCHAR(190) NOT NULL,   -- email or phone
    channel    notification_channel NOT NULL DEFAULT 'email',
    subject    VARCHAR(190) NULL,
    body       TEXT NOT NULL,
    status     VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending | sent | failed
    error      TEXT NULL,
    related_entity   VARCHAR(60) NULL,
    related_entity_id VARCHAR(40) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at    TIMESTAMP NULL
  );
EXCEPTION WHEN duplicate_table THEN NULL; END $$;
