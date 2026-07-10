-- ============================================================================
-- CLINIC MANAGEMENT SYSTEM - SUPABASE SETUP
-- ============================================================================
-- Copy and paste this entire script into your Supabase SQL Editor
-- Go to: https://supabase.com/dashboard → SQL Editor → New Query
-- Paste all code below, then click "Run"
-- ============================================================================

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

-- ============================================================================
-- SCHEMA - CREATE ALL TABLES
-- ============================================================================

-- users table
CREATE TABLE users (
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

-- doctors table
CREATE TABLE doctors (
  id               SERIAL PRIMARY KEY,
  user_id          INT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  specialty        VARCHAR(120) NOT NULL,
  bio              TEXT,
  consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  color            VARCHAR(9)    NOT NULL DEFAULT '#0d9488',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- doctor_schedules table (0=Sun, 1=Mon, ... 6=Sat)
CREATE TABLE doctor_schedules (
  id           SERIAL PRIMARY KEY,
  doctor_id    INT NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time   TIME NOT NULL,
  end_time     TIME NOT NULL,
  slot_minutes SMALLINT NOT NULL DEFAULT 30,
  UNIQUE (doctor_id, day_of_week, start_time)
);

-- patients table
CREATE TABLE patients (
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
CREATE INDEX idx_patients_name  ON patients (full_name);
CREATE INDEX idx_patients_phone ON patients (phone);

-- appointments table
CREATE TABLE appointments (
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
CREATE INDEX idx_appt_date        ON appointments (date);
CREATE INDEX idx_appt_doctor_date ON appointments (doctor_id, date);

-- visits table
CREATE TABLE visits (
  id             SERIAL PRIMARY KEY,
  appointment_id INT NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  diagnosis      TEXT,
  symptoms       TEXT,
  notes          TEXT,
  vitals         JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- prescriptions table
CREATE TABLE prescriptions (
  id           SERIAL PRIMARY KEY,
  visit_id     INT NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  medication   VARCHAR(190) NOT NULL,
  dosage       VARCHAR(100),
  frequency    VARCHAR(100),
  duration     VARCHAR(100),
  instructions VARCHAR(255),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- invoices table
CREATE TABLE invoices (
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
CREATE INDEX idx_inv_status ON invoices (status);

-- invoice_items table
CREATE TABLE invoice_items (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  qty         SMALLINT NOT NULL DEFAULT 1,
  unit_price  NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount      NUMERIC(10,2) NOT NULL DEFAULT 0
);

-- payments table
CREATE TABLE payments (
  id          SERIAL PRIMARY KEY,
  invoice_id  INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount      NUMERIC(10,2) NOT NULL,
  method      VARCHAR(20) NOT NULL DEFAULT 'cash'
                CHECK (method IN ('cash','card','transfer','insurance')),
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_by INT REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================================
-- SEED DATA - INSERT DEMO DATA
-- ============================================================================

-- Users (password123 bcrypt hash: $2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq)
INSERT INTO users (id, name, email, password_hash, role, phone) VALUES
  (1, 'Sarah Admin',       'admin@clinic.com',     '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'admin',        '+1 555 0100'),
  (2, 'Dr. Ahmed Hassan',  'doctor@clinic.com',    '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'doctor',       '+1 555 0101'),
  (3, 'Dr. Layla Mansour', 'layla@clinic.com',     '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'doctor',       '+1 555 0102'),
  (4, 'Omar Reception',    'reception@clinic.com', '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'receptionist', '+1 555 0103'),
  (5, 'John Carter',       'patient@clinic.com',   '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'patient',      '+1 555 0110')
ON CONFLICT (id) DO NOTHING;

-- Doctors
INSERT INTO doctors (id, user_id, specialty, bio, consultation_fee, color) VALUES
  (1, 2, 'General Medicine', 'Board-certified general practitioner with 12 years of experience.', 50.00, '#0d9488'),
  (2, 3, 'Pediatrics',       'Pediatric specialist focused on preventive care and child wellness.', 65.00, '#0284c7')
ON CONFLICT (id) DO NOTHING;

-- Doctor Schedules (weekly availability)
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, slot_minutes) VALUES
  (1, 0, '09:00', '17:00', 30),
  (1, 1, '09:00', '17:00', 30),
  (1, 2, '09:00', '17:00', 30),
  (1, 3, '09:00', '13:00', 30),
  (1, 4, '09:00', '17:00', 30),
  (2, 0, '10:00', '16:00', 30),
  (2, 1, '10:00', '16:00', 30),
  (2, 3, '10:00', '16:00', 30),
  (2, 4, '10:00', '18:00', 30),
  (2, 6, '10:00', '14:00', 30)
ON CONFLICT (doctor_id, day_of_week, start_time) DO NOTHING;

-- Patients (10 demo records)
INSERT INTO patients (id, user_id, full_name, dob, gender, phone, email, address, blood_type, allergies, medical_notes) VALUES
  (1,  5,    'John Carter',      '1988-04-12', 'male',   '+1 555 0110', 'patient@clinic.com',  '12 Main St',   'O+',  'Penicillin', 'Mild hypertension.'),
  (2,  NULL, 'Fatima Al-Sayed',  '1992-09-23', 'female', '+1 555 0111', 'fatima@example.com',  '44 Rose Ave',  'A+',  NULL,        NULL),
  (3,  NULL, 'Michael Brown',    '1975-01-30', 'male',   '+1 555 0112', 'mbrown@example.com',  '7 Oak Lane',   'B-',  'Aspirin',   'Type 2 diabetes.'),
  (4,  NULL, 'Aisha Khalil',     '2001-06-15', 'female', '+1 555 0113', 'aisha@example.com',   '90 Cedar Rd',  'AB+', NULL,        NULL),
  (5,  NULL, 'David Miller',     '1969-11-02', 'male',   '+1 555 0114', 'dmiller@example.com', '3 Pine Ct',    'O-',  NULL,        'Post knee surgery.'),
  (6,  NULL, 'Nour Ibrahim',     '1996-03-08', 'female', '+1 555 0115', 'nour@example.com',    '18 Elm St',    'A-',  'Latex',     NULL),
  (7,  NULL, 'Emily Johnson',    '1983-07-19', 'female', '+1 555 0116', 'emilyj@example.com',  '55 Maple Dr',  'B+',  NULL,        'Asthma.'),
  (8,  NULL, 'Khaled Mostafa',   '1990-12-27', 'male',   '+1 555 0117', 'khaled@example.com',  '21 Birch Blvd','O+',  NULL,        NULL),
  (9,  NULL, 'Sophia Martinez',  '2015-05-05', 'female', '+1 555 0118', NULL,                  '8 Willow Way', 'A+',  'Peanuts',   'Pediatric patient.'),
  (10, NULL, 'Yousef Nasser',    '2012-10-11', 'male',   '+1 555 0119', NULL,                  '67 Ash St',    'B+',  NULL,        'Pediatric patient.')
ON CONFLICT (id) DO NOTHING;

-- Appointments (mix of past, today, and future)
INSERT INTO appointments (id, patient_id, doctor_id, date, start_time, end_time, status, reason, created_by) VALUES
  (1,  1, 1, CURRENT_DATE - 6, '09:00', '09:30', 'completed', 'Blood pressure check',    4),
  (2,  3, 1, CURRENT_DATE - 5, '10:00', '10:30', 'completed', 'Diabetes follow-up',      4),
  (3,  9, 2, CURRENT_DATE - 4, '11:00', '11:30', 'completed', 'Fever and cough',         4),
  (4,  2, 1, CURRENT_DATE - 3, '09:30', '10:00', 'completed', 'General checkup',         4),
  (5,  7, 1, CURRENT_DATE - 2, '14:00', '14:30', 'completed', 'Asthma review',           4),
  (6,  10, 2, CURRENT_DATE - 2, '10:30', '11:00', 'completed', 'Vaccination',             4),
  (7,  5, 1, CURRENT_DATE - 1, '11:00', '11:30', 'completed', 'Knee follow-up',          4),
  (8,  6, 1, CURRENT_DATE - 1, '15:00', '15:30', 'no_show',   'Skin rash',               4),
  (9,  1, 1, CURRENT_DATE,     '09:00', '09:30', 'confirmed', 'Hypertension review',     4),
  (10, 4, 1, CURRENT_DATE,     '10:00', '10:30', 'scheduled', 'Headache and fatigue',    4),
  (11, 9, 2, CURRENT_DATE,     '11:00', '11:30', 'confirmed', 'Allergy consultation',    4),
  (12, 8, 1, CURRENT_DATE,     '13:30', '14:00', 'scheduled', 'Annual physical',         4),
  (13, 2, 2, CURRENT_DATE + 1, '10:00', '10:30', 'scheduled', 'Child wellness visit',    4),
  (14, 3, 1, CURRENT_DATE + 2, '09:30', '10:00', 'scheduled', 'Lab results review',      4),
  (15, 7, 1, CURRENT_DATE + 3, '14:30', '15:00', 'scheduled', 'Prescription renewal',    4),
  (16, 1, 2, CURRENT_DATE + 5, '12:00', '12:30', 'scheduled', 'Referral consultation',   4)
ON CONFLICT (id) DO NOTHING;

-- Visits (completed appointment details)
INSERT INTO visits (id, appointment_id, diagnosis, symptoms, notes, vitals) VALUES
  (1, 1, 'Stage 1 hypertension',             'Occasional headaches',  'Continue medication. Recheck in 4 weeks.',        '{"bp":"138/88","temp":36.7,"weight":82,"height":178}'),
  (2, 2, 'Type 2 diabetes - stable',         'None reported',          'HbA1c improved. Maintain diet and exercise.',     '{"bp":"126/82","temp":36.6,"weight":90,"height":175}'),
  (3, 3, 'Viral upper respiratory infection','Fever 38.2, dry cough',  'Supportive care. Return if not improved in 5d.',  '{"bp":"100/65","temp":38.2,"weight":21,"height":112}'),
  (4, 4, 'Healthy - routine checkup',        'None',                   'All vitals normal.',                              '{"bp":"118/76","temp":36.5,"weight":63,"height":165}'),
  (5, 5, 'Mild persistent asthma',           'Night-time wheezing',    'Adjusted inhaler dosage. Review in 3 months.',    '{"bp":"121/79","temp":36.6,"weight":68,"height":170}'),
  (6, 6, 'Routine vaccination',              'None',                   'MMR booster administered. No reaction.',          '{"temp":36.8,"weight":38,"height":142}'),
  (7, 7, 'Post-operative recovery - OK',     'Mild stiffness',         'Physiotherapy twice weekly recommended.',         '{"bp":"130/85","temp":36.7,"weight":88,"height":180}')
ON CONFLICT (id) DO NOTHING;

-- Prescriptions
INSERT INTO prescriptions (visit_id, medication, dosage, frequency, duration, instructions) VALUES
  (1, 'Lisinopril',          '10 mg',  'Once daily',        '30 days', 'Take in the morning'),
  (2, 'Metformin',           '500 mg', 'Twice daily',       '90 days', 'Take with meals'),
  (3, 'Paracetamol',         '250 mg', 'Every 6 hours',     '5 days',  'As needed for fever'),
  (3, 'Saline nasal spray',  '2 sprays','Three times daily', '7 days',  'Each nostril'),
  (5, 'Budesonide inhaler',  '2 puffs','Twice daily',       '90 days', 'Rinse mouth after use'),
  (7, 'Ibuprofen',           '400 mg', 'Every 8 hours',     '10 days', 'Take after food');

-- Invoices
INSERT INTO invoices (id, invoice_number, patient_id, appointment_id, subtotal, discount, tax, total, status, created_at) VALUES
  (1,'INV-2025-0001',1,1, 50.00, 0, 0, 50.00, 'paid',    NOW() - INTERVAL '6 days'),
  (2,'INV-2025-0002',3,2, 95.00, 5, 0, 90.00, 'paid',    NOW() - INTERVAL '5 days'),
  (3,'INV-2025-0003',9,3, 65.00, 0, 0, 65.00, 'paid',    NOW() - INTERVAL '4 days'),
  (4,'INV-2025-0004',2,4, 50.00, 0, 0, 50.00, 'unpaid',  NOW() - INTERVAL '3 days'),
  (5,'INV-2025-0005',7,5,120.00, 0, 0,120.00, 'partial', NOW() - INTERVAL '2 days'),
  (6,'INV-2025-0006',10,6,85.00, 0, 0, 85.00, 'paid',    NOW() - INTERVAL '2 days'),
  (7,'INV-2025-0007',5,7, 50.00, 0, 0, 50.00, 'unpaid',  NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Invoice Items
INSERT INTO invoice_items (invoice_id, description, qty, unit_price, amount) VALUES
  (1,'Consultation - General Medicine',1,50.00,50.00),
  (2,'Consultation - General Medicine',1,50.00,50.00),
  (2,'HbA1c blood test',               1,45.00,45.00),
  (3,'Consultation - Pediatrics',      1,65.00,65.00),
  (4,'Consultation - General Medicine',1,50.00,50.00),
  (5,'Consultation - General Medicine',1,50.00,50.00),
  (5,'Spirometry test',                1,70.00,70.00),
  (6,'Consultation - Pediatrics',      1,65.00,65.00),
  (6,'MMR vaccine',                    1,20.00,20.00),
  (7,'Consultation - General Medicine',1,50.00,50.00);

-- Payments
INSERT INTO payments (invoice_id, amount, method, paid_at, received_by) VALUES
  (1,50.00,'cash',     NOW() - INTERVAL '6 days', 4),
  (2,90.00,'card',     NOW() - INTERVAL '5 days', 4),
  (3,65.00,'insurance',NOW() - INTERVAL '4 days', 4),
  (5,60.00,'cash',     NOW() - INTERVAL '2 days', 4),
  (6,85.00,'card',     NOW() - INTERVAL '2 days', 4);

-- Reset auto-increment sequences
SELECT setval('users_id_seq',        (SELECT MAX(id) FROM users));
SELECT setval('doctors_id_seq',      (SELECT MAX(id) FROM doctors));
SELECT setval('patients_id_seq',     (SELECT MAX(id) FROM patients));
SELECT setval('appointments_id_seq', (SELECT MAX(id) FROM appointments));
SELECT setval('visits_id_seq',       (SELECT MAX(id) FROM visits));
SELECT setval('invoices_id_seq',     (SELECT MAX(id) FROM invoices));
SELECT setval('invoice_items_id_seq',(SELECT MAX(id) FROM invoice_items));
SELECT setval('payments_id_seq',     (SELECT MAX(id) FROM payments));

-- ============================================================================
-- DONE! All tables created and seeded with demo data.
-- ============================================================================
