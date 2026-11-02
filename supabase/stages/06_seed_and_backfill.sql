-- ============================================================================
-- STAGE 6: SEED SPECIALTIES & SAFE AUTH USER BACKFILL
-- ============================================================================

BEGIN;

-- 1. Default Specialties Seed
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

-- 2. Safe Backfill for Existing Auth Users
-- Admin privileges preserved strictly from raw_app_meta_data.
-- Doctors are preserved with verification_status = 'PENDING' and is_public = false.
DO $$
DECLARE
    r RECORD;
    v_role TEXT;
    v_spec UUID;
BEGIN
    SELECT id INTO v_spec FROM public.specialties LIMIT 1;

    FOR r IN SELECT id, email, raw_user_meta_data, raw_app_meta_data FROM auth.users LOOP
        IF COALESCE(r.raw_app_meta_data->>'role', '') = 'ADMIN' THEN
            v_role := 'ADMIN';
        ELSIF UPPER(COALESCE(r.raw_user_meta_data->>'role', 'PATIENT')) = 'DOCTOR' THEN
            v_role := 'DOCTOR';
        ELSE
            v_role := 'PATIENT';
        END IF;

        INSERT INTO public.profiles (id, full_name, role, account_status)
        VALUES (
            r.id,
            COALESCE(r.raw_user_meta_data->>'full_name', r.raw_user_meta_data->>'name', split_part(COALESCE(r.email, 'user'), '@', 1)),
            v_role,
            'ACTIVE'
        ) ON CONFLICT (id) DO UPDATE SET
            role = CASE WHEN public.profiles.role = 'ADMIN' THEN 'ADMIN' ELSE EXCLUDED.role END;

        IF v_role = 'DOCTOR' THEN
            INSERT INTO public.doctor_profiles (
                user_id,
                specialty_id,
                qualification,
                registration_number,
                verification_status,
                is_public
            ) VALUES (
                r.id,
                v_spec,
                COALESCE(r.raw_user_meta_data->>'qualification', 'Specialist Physician'),
                COALESCE(r.raw_user_meta_data->>'registration_number', 'PENDING-REG'),
                'PENDING',
                false
            ) ON CONFLICT (user_id) DO NOTHING;
        END IF;

        INSERT INTO public.user_preferences (user_id)
        VALUES (r.id)
        ON CONFLICT (user_id) DO NOTHING;
    END LOOP;
END $$;

-- Post-Stage 6 Verification Query
SELECT 
    'PROFILES' as entity, count(*) as count, role 
FROM public.profiles 
GROUP BY role
UNION ALL
SELECT 
    'DOCTOR_PROFILES' as entity, count(*) as count, verification_status 
FROM public.doctor_profiles 
GROUP BY verification_status;

COMMIT;
