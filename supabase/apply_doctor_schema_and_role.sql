-- ============================================================================
-- MEDICONNECT: SAFE SCHEMA MIGRATION & DOCTOR ACCOUNT RESOLUTION SCRIPT
-- ============================================================================
-- Target Supabase Project: qlfizttqpovyvurkrxvs (https://qlfizttqpovyvurkrxvs.supabase.co)
-- Execution Note: DO NOT EXECUTE AUTOMATICALLY. FOR OWNER REVIEW AND MANUAL EXECUTION ONLY.
--
-- AUDIT & SAFETY ASSESSMENT:
-- 1. Non-destructive: Renames existing legacy tables to legacy_* (NO DROP, NO TRUNCATE).
-- 2. Data Loss Prevention: Does not discard existing legacy data.
-- 3. Idempotent: Uses IF NOT EXISTS, CREATE OR REPLACE, and ON CONFLICT guards.
-- 4. No Auto-Approval: Sets doctor verification to 'PENDING' and is_public to false.
-- 5. Anti-Tampering: Enforces database-level triggers to prevent role self-escalation
--    and doctor self-verification.
-- 6. RLS Protection: Enables Row Level Security on all tables with explicit policies.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: PRESERVE EXISTING LEGACY TABLES (NON-DESTRUCTIVE RENAME)
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_users') THEN
        ALTER TABLE public.users RENAME TO legacy_users;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'doctors')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_doctors') THEN
        ALTER TABLE public.doctors RENAME TO legacy_doctors;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 2: CREATE CORE HEALTHCARE SCHEMA (IF NOT EXISTS)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Helper function: is_admin check for RLS & triggers
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        COALESCE(
            (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role'),
            ''
        ) ILIKE 'ADMIN'
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'PATIENT' CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    avatar_path TEXT,
    account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'DISABLED', 'PENDING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(account_status);

-- 2. Specialties Table
CREATE TABLE IF NOT EXISTS public.specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Seed core specialties
INSERT INTO public.specialties (id, name, description, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Cardiology', 'Expert diagnosis, prevention, and treatment of heart conditions.', true),
    ('11111111-1111-1111-1111-111111111102', 'General Medicine', 'Primary healthcare, chronic disease management, and preventive medical screenings.', true),
    ('11111111-1111-1111-1111-111111111103', 'Pediatrics', 'Comprehensive healthcare for infants, children, and adolescents.', true),
    ('11111111-1111-1111-1111-111111111104', 'Emergency Care', '24/7 rapid response triage and critical intervention.', true),
    ('11111111-1111-1111-1111-111111111105', 'Neurology', 'Specialized neurological disorder care and rehabilitation.', true)
ON CONFLICT (name) DO NOTHING;

-- 3. Doctor Profiles Table
CREATE TABLE IF NOT EXISTS public.doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    specialty_id UUID REFERENCES public.specialties(id) ON DELETE SET NULL,
    qualification TEXT NOT NULL,
    experience_years INT NOT NULL DEFAULT 0 CHECK (experience_years >= 0),
    consultation_fee NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (consultation_fee >= 0),
    biography TEXT,
    registration_number TEXT,
    verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    is_public BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_doctor_user_id ON public.doctor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_doctor_verification ON public.doctor_profiles(verification_status, is_public);

-- ----------------------------------------------------------------------------
-- STEP 3: SECURITY TRIGGERS (ANTI-TAMPERING & SELF-ELEVATION GUARDS)
-- ----------------------------------------------------------------------------

-- Prevent Role Escalation (Database-Level Guard)
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        IF NEW.role <> OLD.role THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their assigned system role.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- Prevent Doctor Self-Verification & Self-Publishing (Database-Level Guard)
CREATE OR REPLACE FUNCTION public.prevent_doctor_self_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT public.is_admin() THEN
        IF TG_OP = 'INSERT' THEN
            IF NEW.verification_status <> 'PENDING' THEN
                RAISE EXCEPTION 'Unauthorized: Newly registered doctors must have PENDING verification status.';
            END IF;
            IF NEW.is_public = true THEN
                RAISE EXCEPTION 'Unauthorized: Newly registered doctors cannot be marked public until approved.';
            END IF;
        ELSIF TG_OP = 'UPDATE' THEN
            IF NEW.verification_status <> OLD.verification_status THEN
                RAISE EXCEPTION 'Unauthorized: Only hospital administrators can modify doctor verification status.';
            END IF;
            IF NEW.is_public <> OLD.is_public AND NEW.verification_status <> 'APPROVED' THEN
                RAISE EXCEPTION 'Unauthorized: Unapproved doctor profiles cannot be made public.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trigger_prevent_doctor_self_verification ON public.doctor_profiles;
CREATE TRIGGER trigger_prevent_doctor_self_verification
    BEFORE INSERT OR UPDATE ON public.doctor_profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_doctor_self_verification();

-- ----------------------------------------------------------------------------
-- STEP 4: ROW LEVEL SECURITY POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_public_read_approved_doctors" ON public.profiles;
CREATE POLICY "profiles_public_read_approved_doctors" ON public.profiles FOR SELECT USING (
    role = 'DOCTOR' AND id IN (SELECT user_id FROM public.doctor_profiles WHERE verification_status = 'APPROVED')
);

-- Doctor Profiles Policies
DROP POLICY IF EXISTS "doctor_profiles_read_own" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_read_own" ON public.doctor_profiles FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_profiles_admin_all" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_admin_all" ON public.doctor_profiles FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "doctor_profiles_update_own" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_update_own" ON public.doctor_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_profiles_read_public" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_read_public" ON public.doctor_profiles FOR SELECT USING (verification_status = 'APPROVED' AND is_public = true);

-- Specialties Policies
DROP POLICY IF EXISTS "specialties_read_all" ON public.specialties;
CREATE POLICY "specialties_read_all" ON public.specialties FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- STEP 5: PERMISSIONS & API ACCESS GRANTS
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.doctor_profiles TO authenticated;
GRANT SELECT ON public.doctor_profiles TO anon;
GRANT SELECT ON public.specialties TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- STEP 6: PROVISION CLINICAL PROFILE FOR USER (PENDING VERIFICATION)
-- ----------------------------------------------------------------------------
-- SECURITY NOTE: This provisions the practitioner profile with 'PENDING' status.
-- Automatic doctor approval is strictly prohibited. The hospital administrator
-- must review the medical registration credentials before approving.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    target_email TEXT := 'quadroselissa1810@gmail.com';
    target_user_id UUID;
    target_spec_id UUID;
    target_name TEXT;
BEGIN
    -- 1. Identify user in auth.users
    SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', split_part(email, '@', 1))
    INTO target_user_id, target_name
    FROM auth.users
    WHERE LOWER(email) = LOWER(target_email);

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'Target user % not found in auth.users', target_email;
    ELSE
        -- 2. Synchronize raw_user_meta_data to DOCTOR
        UPDATE auth.users
        SET raw_user_meta_data = jsonb_set(
            COALESCE(raw_user_meta_data, '{}'::jsonb),
            '{role}',
            '"DOCTOR"'
        )
        WHERE id = target_user_id;

        -- 3. Upsert into public.profiles as DOCTOR
        INSERT INTO public.profiles (id, full_name, role, account_status, updated_at)
        VALUES (
            target_user_id,
            COALESCE(target_name, 'Dr. Elissa Quadros'),
            'DOCTOR',
            'ACTIVE',
            timezone('utc', now())
        )
        ON CONFLICT (id) DO UPDATE SET
            role = 'DOCTOR',
            account_status = 'ACTIVE',
            updated_at = timezone('utc', now());

        -- 4. Get Cardiology specialty
        SELECT id INTO target_spec_id FROM public.specialties WHERE name = 'Cardiology' LIMIT 1;
        IF target_spec_id IS NULL THEN
            SELECT id INTO target_spec_id FROM public.specialties LIMIT 1;
        END IF;

        -- 5. Provision doctor_profiles record with 'PENDING' status (Hospital Standard)
        INSERT INTO public.doctor_profiles (
            user_id,
            specialty_id,
            qualification,
            registration_number,
            experience_years,
            consultation_fee,
            verification_status,
            is_public,
            biography,
            updated_at
        )
        VALUES (
            target_user_id,
            target_spec_id,
            'MBBS, MD - Specialist Physician',
            'MCI-REG-' || UPPER(SUBSTRING(target_user_id::text, 1, 8)),
            8,
            1200.00,
            'PENDING',
            false,
            'Specialist Physician at MediConnect Hospital.',
            timezone('utc', now())
        )
        ON CONFLICT (user_id) DO UPDATE SET
            qualification = 'MBBS, MD - Specialist Physician',
            updated_at = timezone('utc', now());

        RAISE NOTICE 'SUCCESS: Doctor profile created with PENDING verification status for % (ID: %). Ready for administrator review.', target_email, target_user_id;
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- OPTIONAL POST-VERIFICATION STEP (ADMINISTRATOR ONLY):
-- Run this statement manually in Supabase SQL Editor AFTER credentials are verified:
--
-- UPDATE public.doctor_profiles
-- SET verification_status = 'APPROVED', is_public = true, updated_at = now()
-- WHERE user_id = (SELECT id FROM auth.users WHERE LOWER(email) = 'quadroselissa1810@gmail.com');
-- ============================================================================
