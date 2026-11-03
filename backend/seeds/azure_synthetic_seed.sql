-- Synthetic development/demo data only. Apply once, after the schema migrations,
-- to a fresh database. The user/doctor inserts are not rerunnable; a second run
-- fails on primary/unique keys. Do not use this seed to refresh an existing DB.
-- These users have no passwords or Entra identities and cannot sign in until an
-- administrator links them to validated identities.

INSERT IGNORE INTO specialties (id, name, description, is_active) VALUES
    (1, 'Cardiology', 'Synthetic demo specialty.', TRUE),
    (2, 'General Medicine', 'Synthetic demo specialty.', TRUE),
    (3, 'Pediatrics', 'Synthetic demo specialty.', TRUE);

INSERT INTO users (id, name, email, phone, role, status) VALUES
    (90001, 'Sample Patient One', 'patient01@example.invalid', NULL, 'PATIENT', 'ACTIVE'),
    (90002, 'Sample Doctor One', 'doctor01@example.invalid', NULL, 'DOCTOR', 'ACTIVE'),
    (90003, 'Sample Administrator One', 'admin01@example.invalid', NULL, 'ADMIN', 'ACTIVE');

INSERT INTO doctors (
    id, user_id, specialty, specialty_id, qualification, experience_years,
    consultation_fee, bio, registration_number, verification_status, is_public
) VALUES (
    90001, 90002, 'Cardiology', 1, 'Synthetic demo qualification', 5,
    0.00, 'Synthetic doctor profile for classroom testing.',
    'SYNTH-REG-90001', 'APPROVED', TRUE
);
