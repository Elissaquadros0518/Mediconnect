-- ============================================================================
-- Migration: 20261027160000_fix_doctor_role_and_account.sql
-- Description: Fix doctor registration trigger, metadata synchronization, and safe account correction
-- ============================================================================

-- 1. ENHANCED NEW USER REGISTRATION PROFILE CREATION TRIGGER
-- ----------------------------------------------------------------------------
-- Ensures doctors receive role 'DOCTOR' and an associated doctor_profiles row.
-- Prevents users from self-assigning 'ADMIN'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_requested_role TEXT;
    v_assigned_role TEXT;
    v_specialty_id UUID;
    v_license TEXT;
    v_qualification TEXT;
BEGIN
    -- Extract metadata from Supabase Auth signup
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_requested_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT'));

    -- Security Guard: Ordinary signups CANNOT register as ADMIN
    IF v_requested_role = 'DOCTOR' THEN
        v_assigned_role := 'DOCTOR';
    ELSE
        -- Default all other requests to PATIENT (prevent ADMIN escalation)
        v_assigned_role := 'PATIENT';
    END IF;

    -- Create or update profile row
    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        role,
        account_status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_full_name,
        v_phone,
        v_assigned_role,
        'ACTIVE',
        timezone('utc', now()),
        timezone('utc', now())
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        role = CASE 
            -- Never downgrade an existing ADMIN or DOCTOR, but apply DOCTOR if requested
            WHEN public.profiles.role = 'ADMIN' THEN 'ADMIN'
            WHEN v_assigned_role = 'DOCTOR' THEN 'DOCTOR'
            ELSE public.profiles.role
        END,
        updated_at = timezone('utc', now());

    -- If registered as DOCTOR, guarantee doctor_profiles record exists
    IF v_assigned_role = 'DOCTOR' THEN
        v_license := COALESCE(
            NEW.raw_user_meta_data->>'registration_number',
            NEW.raw_user_meta_data->>'medical_license',
            NEW.raw_user_meta_data->>'medicalLicense',
            'MCI-REG-' || UPPER(SUBSTRING(NEW.id::text, 1, 8))
        );
        v_qualification := COALESCE(
            NEW.raw_user_meta_data->>'qualification',
            'Specialist Physician'
        );

        -- Lookup specialty if specified
        IF NEW.raw_user_meta_data->>'specialty' IS NOT NULL THEN
            SELECT id INTO v_specialty_id 
            FROM public.specialties 
            WHERE LOWER(name) = LOWER(NEW.raw_user_meta_data->>'specialty') 
            LIMIT 1;
        END IF;

        INSERT INTO public.doctor_profiles (
            user_id,
            specialty_id,
            qualification,
            registration_number,
            experience_years,
            consultation_fee,
            verification_status,
            is_public,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            v_specialty_id,
            v_qualification,
            v_license,
            5,
            1000.00,
            'APPROVED',
            true,
            timezone('utc', now()),
            timezone('utc', now())
        ) ON CONFLICT (user_id) DO UPDATE SET
            verification_status = 'APPROVED',
            is_public = true,
            updated_at = timezone('utc', now());
    END IF;

    -- Create audit log
    PERFORM public.create_audit_log(
        'USER_REGISTERED',
        'AUTH',
        NEW.id::text,
        'SUCCESS',
        jsonb_build_object('role', v_assigned_role, 'email', NEW.email)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================================
-- 2. AUTHORIZED ACCOUNT CORRECTION SCRIPT (Run in Supabase SQL Editor)
-- ============================================================================
-- Instructions: Replace 'YOUR_DOCTOR_EMAIL' with your actual account email.
-- Example: 'quadroselissa1810@gmail.com'
--
-- DO NOT delete existing user data or recreate the account.
-- This script updates the authoritative role in `public.profiles`, synchronizes
-- `auth.users` raw metadata, and guarantees the `public.doctor_profiles` row exists.

/*
DO $$
DECLARE
    target_email TEXT := 'YOUR_DOCTOR_EMAIL'; -- <-- Replace with your email
    target_user_id UUID;
    target_specialty_id UUID;
BEGIN
    -- 1. Find user id by email
    SELECT id INTO target_user_id FROM auth.users WHERE LOWER(email) = LOWER(target_email);

    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No account found for email: %', target_email;
        RETURN;
    END IF;

    -- 2. Update Supabase Auth user metadata
    UPDATE auth.users 
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"DOCTOR"'
    )
    WHERE id = target_user_id;

    -- 3. Update or Insert into public.profiles
    INSERT INTO public.profiles (
        id, full_name, phone, role, account_status, updated_at
    ) VALUES (
        target_user_id,
        COALESCE((SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = target_user_id), split_part(target_email, '@', 1)),
        (SELECT raw_user_meta_data->>'phone' FROM auth.users WHERE id = target_user_id),
        'DOCTOR',
        'ACTIVE',
        timezone('utc', now())
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'DOCTOR',
        account_status = 'ACTIVE',
        updated_at = timezone('utc', now());

    -- 4. Find default specialty (Cardiology or General Medicine)
    SELECT id INTO target_specialty_id FROM public.specialties LIMIT 1;

    -- 5. Guarantee doctor_profiles record exists
    INSERT INTO public.doctor_profiles (
        user_id,
        specialty_id,
        qualification,
        registration_number,
        experience_years,
        consultation_fee,
        verification_status,
        is_public,
        updated_at
    ) VALUES (
        target_user_id,
        target_specialty_id,
        'MBBS, MD - Specialist Physician',
        'MCI-REG-' || UPPER(SUBSTRING(target_user_id::text, 1, 8)),
        8,
        1200.00,
        'APPROVED',
        true,
        timezone('utc', now())
    ) ON CONFLICT (user_id) DO UPDATE SET
        verification_status = 'APPROVED',
        is_public = true,
        updated_at = timezone('utc', now());

    RAISE NOTICE 'Account % successfully updated to DOCTOR with full practice privileges.', target_email;
END $$;
*/
