-- ============================================================================
-- MediConnect Database Seed Data
-- Safe, idempotent seed script for initial specialties and development data.
-- ============================================================================

-- 1. Medical Specialties
INSERT INTO public.specialties (id, name, description, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Cardiology', 'Expert diagnosis, prevention, and treatment of heart conditions, coronary disease, and arrhythmias.', true),
    ('11111111-1111-1111-1111-111111111102', 'General Medicine', 'Comprehensive primary health care, chronic disease management, and preventive medical screenings.', true),
    ('11111111-1111-1111-1111-111111111103', 'Pediatrics', 'Dedicated medical care for infants, children, and adolescents, including immunizations and growth checks.', true),
    ('11111111-1111-1111-1111-111111111104', 'Emergency Care', '24/7 rapid response triage, acute trauma care, and critical medical intervention.', true),
    ('11111111-1111-1111-1111-111111111105', 'Neurology', 'Specialized care for neurological disorders, stroke rehabilitation, epilepsy, and migraine treatment.', true),
    ('11111111-1111-1111-1111-111111111106', 'Orthopedics', 'Musculoskeletal health, joint replacement, sports injury recovery, and spinal treatments.', true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- Notice:
-- In Supabase, user accounts must be created through Supabase Auth (Sign Up in UI or via supabase.auth.signUp() in code/tests).
-- Once a doctor signs up with role='DOCTOR', their doctor_profiles row is created automatically by the database trigger `handle_new_user()`.
-- Administrators can then approve doctors by setting verification_status = 'APPROVED' and is_public = true.
