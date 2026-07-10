-- Clinic Management System - PostgreSQL Seed Data

-- ---------------------------------------------------------------------------
-- Users (password for all: password123)
-- ---------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, phone) VALUES
  (1, 'Sarah Admin',        'admin@clinic.com',     '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'admin',        '+1 555 0100'),
  (2, 'Dr. Ahmed Hassan',   'doctor@clinic.com',    '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'doctor',       '+1 555 0101'),
  (3, 'Dr. Layla Mansour',  'layla@clinic.com',     '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'doctor',       '+1 555 0102'),
  (4, 'Omar Reception',     'reception@clinic.com', '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'receptionist', '+1 555 0103'),
  (5, 'John Carter',        'patient@clinic.com',   '$2a$10$u.c22ZZl/xHY05QKtRKoFeYdcubteNUYxjGVvKWaiQhKtgivBvbGq', 'patient',      '+1 555 0110');

-- Reset user sequence starting point since we inserted manual IDs
ALTER SEQUENCE users_id_seq RESTART WITH 6;

-- ---------------------------------------------------------------------------
-- Doctors
-- ---------------------------------------------------------------------------
INSERT INTO doctors (id, user_id, specialty, bio, consultation_fee, color) VALUES
  (1, 2, 'General Medicine', 'Board-certified general practitioner with 12 years of experience.', 50.00, '#0d9488'),
  (2, 3, 'Pediatrics',       'Pediatric specialist focused on preventive care and child wellness.', 65.00, '#0284c7');

ALTER SEQUENCE doctors_id_seq RESTART WITH 3;

-- Weekly schedules (0 = Sunday ... 6 = Saturday)
INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, slot_minutes) VALUES
  (1, 1, 0, '09:00', '17:00', 30),
  (2, 1, 1, '09:00', '17:00', 30),
  (3, 1, 2, '09:00', '17:00', 30),
  (4, 1, 3, '09:00', '13:00', 30),
  (5, 1, 4, '09:00', '17:00', 30),
  (6, 2, 0, '10:00', '16:00', 30),
  (7, 2, 1, '10:00', '16:00', 30),
  (8, 2, 3, '10:00', '16:00', 30),
  (9, 2, 4, '10:00', '18:00', 30),
  (10, 2, 6, '10:00', '14:00', 30);

ALTER SEQUENCE doctor_schedules_id_seq RESTART WITH 11;

-- ---------------------------------------------------------------------------
-- Patients
-- ---------------------------------------------------------------------------
INSERT INTO patients (id, user_id, full_name, dob, gender, phone, email, address, blood_type, allergies, medical_notes) VALUES
  (1, 5,    'John Carter',      '1988-04-12', 'male',   '+1 555 0110', 'patient@clinic.com',  '12 Main St, Springfield',   'O+',  'Penicillin',      'Mild hypertension, monitored.'),
  (2, NULL, 'Fatima Al-Sayed',  '1992-09-23', 'female', '+1 555 0111', 'fatima@example.com',  '44 Rose Ave, Springfield',  'A+',  NULL,              NULL),
  (3, NULL, 'Michael Brown',    '1975-01-30', 'male',   '+1 555 0112', 'mbrown@example.com',  '7 Oak Lane, Springfield',   'B-',  'Aspirin',         'Type 2 diabetes.'),
  (4, NULL, 'Aisha Khalil',     '2001-06-15', 'female', '+1 555 0113', 'aisha@example.com',   '90 Cedar Rd, Springfield',  'AB+', NULL,              NULL),
  (5, NULL, 'David Miller',     '1969-11-02', 'male',   '+1 555 0114', 'dmiller@example.com', '3 Pine Ct, Springfield',    'O-',  NULL,              'Post knee surgery follow-up.'),
  (6, NULL, 'Nour Ibrahim',     '1996-03-08', 'female', '+1 555 0115', 'nour@example.com',    '18 Elm St, Springfield',    'A-',  'Latex',           NULL),
  (7, NULL, 'Emily Johnson',    '1983-07-19', 'female', '+1 555 0116', 'emilyj@example.com',  '55 Maple Dr, Springfield',  'B+',  NULL,              'Asthma - carries inhaler.'),
  (8, NULL, 'Khaled Mostafa',   '1990-12-27', 'male',   '+1 555 0117', 'khaled@example.com',  '21 Birch Blvd, Springfield','O+',  NULL,              NULL),
  (9, NULL, 'Sophia Martinez',  '2015-05-05', 'female', '+1 555 0118', NULL,                  '8 Willow Way, Springfield', 'A+',  'Peanuts',         'Pediatric patient.'),
  (10, NULL,'Yousef Nasser',    '2012-10-11', 'male',   '+1 555 0119', NULL,                  '67 Ash St, Springfield',    'B+',  NULL,              'Pediatric patient.');

ALTER SEQUENCE patients_id_seq RESTART WITH 11;

-- ---------------------------------------------------------------------------
-- Appointments (relative to today's date so the dashboard looks alive)
-- ---------------------------------------------------------------------------
INSERT INTO appointments (id, patient_id, doctor_id, date, start_time, end_time, status, reason, created_by) VALUES
  -- Past week (completed)
  (1, 1, 1, CURRENT_DATE - INTERVAL '6 days', '09:00', '09:30', 'completed', 'Blood pressure check', 4),
  (2, 3, 1, CURRENT_DATE - INTERVAL '5 days', '10:00', '10:30', 'completed', 'Diabetes follow-up', 4),
  (3, 9, 2, CURRENT_DATE - INTERVAL '4 days', '11:00', '11:30', 'completed', 'Fever and cough', 4),
  (4, 2, 1, CURRENT_DATE - INTERVAL '3 days', '09:30', '10:00', 'completed', 'General checkup', 4),
  (5, 7, 1, CURRENT_DATE - INTERVAL '2 days', '14:00', '14:30', 'completed', 'Asthma review', 4),
  (6, 10, 2, CURRENT_DATE - INTERVAL '2 days', '10:30', '11:00', 'completed', 'Vaccination', 4),
  (7, 5, 1, CURRENT_DATE - INTERVAL '1 day', '11:00', '11:30', 'completed', 'Knee surgery follow-up', 4),
  (8, 6, 1, CURRENT_DATE - INTERVAL '1 day', '15:00', '15:30', 'no_show',   'Skin rash', 4),
  -- Today
  (9,  1, 1, CURRENT_DATE, '09:00', '09:30', 'confirmed', 'Hypertension review', 4),
  (10, 4, 1, CURRENT_DATE, '10:00', '10:30', 'scheduled', 'Headache and fatigue', 4),
  (11, 9, 2, CURRENT_DATE, '11:00', '11:30', 'confirmed', 'Allergy consultation', 4),
  (12, 8, 1, CURRENT_DATE, '13:30', '14:00', 'scheduled', 'Annual physical', 4),
  -- Upcoming
  (13, 2, 2, CURRENT_DATE + INTERVAL '1 day', '10:00', '10:30', 'scheduled', 'Child wellness visit', 4),
  (14, 3, 1, CURRENT_DATE + INTERVAL '2 days', '09:30', '10:00', 'scheduled', 'Lab results review', 4),
  (15, 7, 1, CURRENT_DATE + INTERVAL '3 days', '14:30', '15:00', 'scheduled', 'Prescription renewal', 4),
  (16, 1, 2, CURRENT_DATE + INTERVAL '5 days', '12:00', '12:30', 'scheduled', 'Referral consultation', 4);

ALTER SEQUENCE appointments_id_seq RESTART WITH 17;

-- ---------------------------------------------------------------------------
-- Visits + prescriptions for completed appointments
-- ---------------------------------------------------------------------------
INSERT INTO visits (id, appointment_id, diagnosis, symptoms, notes, vitals) VALUES
  (1, 1, 'Stage 1 hypertension', 'Occasional headaches', 'Continue current medication. Recheck in 4 weeks.', '{"bp": "138/88", "temp": 36.7, "weight": 82, "height": 178}'),
  (2, 2, 'Type 2 diabetes - stable', 'None reported', 'HbA1c improved. Maintain diet and exercise plan.', '{"bp": "126/82", "temp": 36.6, "weight": 90, "height": 175}'),
  (3, 3, 'Viral upper respiratory infection', 'Fever 38.2, dry cough', 'Supportive care. Return if symptoms persist beyond 5 days.', '{"bp": "100/65", "temp": 38.2, "weight": 21, "height": 112}'),
  (4, 4, 'Healthy - routine checkup', 'None', 'All vitals within normal range.', '{"bp": "118/76", "temp": 36.5, "weight": 63, "height": 165}'),
  (5, 5, 'Mild persistent asthma', 'Night-time wheezing', 'Adjusted inhaler dosage. Review in 3 months.', '{"bp": "121/79", "temp": 36.6, "weight": 68, "height": 170}'),
  (6, 6, 'Routine vaccination', 'None', 'MMR booster administered. No adverse reaction.', '{"temp": 36.8, "weight": 38, "height": 142}'),
  (7, 7, 'Post-operative recovery - satisfactory', 'Mild stiffness', 'Physiotherapy recommended twice weekly.', '{"bp": "130/85", "temp": 36.7, "weight": 88, "height": 180}');

ALTER SEQUENCE visits_id_seq RESTART WITH 8;

INSERT INTO prescriptions (id, visit_id, medication, dosage, frequency, duration, instructions) VALUES
  (1, 1, 'Lisinopril',   '10 mg',  'Once daily',        '30 days', 'Take in the morning with water'),
  (2, 2, 'Metformin',    '500 mg', 'Twice daily',       '90 days', 'Take with meals'),
  (3, 3, 'Paracetamol',  '250 mg', 'Every 6 hours',     '5 days',  'As needed for fever'),
  (4, 3, 'Saline nasal spray', '2 sprays', 'Three times daily', '7 days', 'Each nostril'),
  (5, 5, 'Budesonide inhaler', '2 puffs', 'Twice daily', '90 days', 'Rinse mouth after use'),
  (6, 7, 'Ibuprofen',    '400 mg', 'Every 8 hours',     '10 days', 'Take after food');

ALTER SEQUENCE prescriptions_id_seq RESTART WITH 7;

-- ---------------------------------------------------------------------------
-- Invoices, items, payments
-- ---------------------------------------------------------------------------
INSERT INTO invoices (id, invoice_number, patient_id, appointment_id, subtotal, discount, tax, total, status, created_at) VALUES
  (1, 'INV-2025-0001', 1, 1, 50.00,  0.00, 0.00, 50.00,  'paid',    NOW() - INTERVAL '6 days'),
  (2, 'INV-2025-0002', 3, 2, 95.00,  5.00, 0.00, 90.00,  'paid',    NOW() - INTERVAL '5 days'),
  (3, 'INV-2025-0003', 9, 3, 65.00,  0.00, 0.00, 65.00,  'paid',    NOW() - INTERVAL '4 days'),
  (4, 'INV-2025-0004', 2, 4, 50.00,  0.00, 0.00, 50.00,  'unpaid',  NOW() - INTERVAL '3 days'),
  (5, 'INV-2025-0005', 7, 5, 120.00, 0.00, 0.00, 120.00, 'partial', NOW() - INTERVAL '2 days'),
  (6, 'INV-2025-0006', 10, 6, 85.00, 0.00, 0.00, 85.00,  'paid',    NOW() - INTERVAL '2 days'),
  (7, 'INV-2025-0007', 5, 7, 50.00,  0.00, 0.00, 50.00,  'unpaid',  NOW() - INTERVAL '1 day');

ALTER SEQUENCE invoices_id_seq RESTART WITH 8;

INSERT INTO invoice_items (id, invoice_id, description, qty, unit_price, amount) VALUES
  (1, 1, 'Consultation - General Medicine', 1, 50.00, 50.00),
  (2, 2, 'Consultation - General Medicine', 1, 50.00, 50.00),
  (3, 2, 'HbA1c blood test',                1, 45.00, 45.00),
  (4, 3, 'Consultation - Pediatrics',       1, 65.00, 65.00),
  (5, 4, 'Consultation - General Medicine', 1, 50.00, 50.00),
  (6, 5, 'Consultation - General Medicine', 1, 50.00, 50.00),
  (7, 5, 'Spirometry test',                 1, 70.00, 70.00),
  (8, 6, 'Consultation - Pediatrics',       1, 65.00, 65.00),
  (9, 6, 'MMR vaccine',                     1, 20.00, 20.00),
  (10, 7, 'Consultation - General Medicine', 1, 50.00, 50.00);

ALTER SEQUENCE invoice_items_id_seq RESTART WITH 11;

INSERT INTO payments (id, invoice_id, amount, method, paid_at, received_by) VALUES
  (1, 1, 50.00, 'cash',      NOW() - INTERVAL '6 days', 4),
  (2, 2, 90.00, 'card',      NOW() - INTERVAL '5 days', 4),
  (3, 3, 65.00, 'insurance', NOW() - INTERVAL '4 days', 4),
  (4, 5, 60.00, 'cash',      NOW() - INTERVAL '2 days', 4),
  (5, 6, 85.00, 'card',      NOW() - INTERVAL '2 days', 4);

ALTER SEQUENCE payments_id_seq RESTART WITH 6;
