-- ============================================================================
-- MEDICONNECT COMPLETE SUPABASE DATABASE SCHEMA & SETUP
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/qlfizttqpovyvurkrxvs/sql)
-- Or apply via Supabase CLI: supabase db push
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. CORE APPLICATION TABLES
-- ----------------------------------------------------------------------------

-- A. PROFILES
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

-- B. SPECIALTIES
CREATE TABLE IF NOT EXISTS public.specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_specialties_active ON public.specialties(is_active);

-- C. DOCTOR_PROFILES
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
CREATE INDEX IF NOT EXISTS idx_doctor_specialty ON public.doctor_profiles(specialty_id);
CREATE INDEX IF NOT EXISTS idx_doctor_public_approved ON public.doctor_profiles(is_public, verification_status);

-- D. AVAILABILITY_SLOTS
CREATE TABLE IF NOT EXISTS public.availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'CANCELLED', 'UNAVAILABLE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT check_slot_positive_duration CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_slot_doctor_status_time ON public.availability_slots(doctor_id, status, start_time);
CREATE INDEX IF NOT EXISTS idx_slot_start_time ON public.availability_slots(start_time);

-- E. APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL UNIQUE REFERENCES public.availability_slots(id) ON DELETE RESTRICT,
    consultation_reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appt_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appt_slot ON public.appointments(slot_id);
CREATE INDEX IF NOT EXISTS idx_appt_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appt_created ON public.appointments(created_at DESC);

-- F. MEDICAL_DOCUMENTS
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 20971520),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_med_doc_patient ON public.medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_med_doc_uploaded_by ON public.medical_documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_med_doc_appt ON public.medical_documents(appointment_id);

-- G. VISIT_SUMMARIES
CREATE TABLE IF NOT EXISTS public.visit_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    diagnosis TEXT,
    prescribed_medications TEXT,
    follow_up_date DATE,
    prescription_document_id UUID REFERENCES public.medical_documents(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_visit_sum_appt ON public.visit_summaries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_visit_sum_doctor ON public.visit_summaries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_visit_sum_patient ON public.visit_summaries(patient_id);

-- H. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('APPOINTMENT', 'DOCUMENT', 'SUMMARY', 'SYSTEM', 'SECURITY')),
    read_at TIMESTAMPTZ,
    related_resource_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notif_user_read ON public.notifications(user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notif_created ON public.notifications(created_at DESC);

-- I. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'DENIED', 'PENDING')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- J. USER_PREFERENCES
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
    notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "in_app": true, "sms": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_user_prefs_user ON public.user_preferences(user_id);

-- ----------------------------------------------------------------------------
-- 3. TRIGGERS AND FUNCTIONS
-- ----------------------------------------------------------------------------

-- Function: handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_doctor_profiles_updated_at ON public.doctor_profiles;
CREATE TRIGGER trigger_doctor_profiles_updated_at BEFORE UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_availability_slots_updated_at ON public.availability_slots;
CREATE TRIGGER trigger_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON public.appointments;
CREATE TRIGGER trigger_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_visit_summaries_updated_at ON public.visit_summaries;
CREATE TRIGGER trigger_visit_summaries_updated_at BEFORE UPDATE ON public.visit_summaries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Security Functions
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_role, 'ANONYMOUS');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_user_role(auth.uid()) = 'ADMIN');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_user_role(auth.uid()) = 'DOCTOR');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.get_my_doctor_id()
RETURNS UUID AS $$
DECLARE
    v_doctor_id UUID;
BEGIN
    SELECT id INTO v_doctor_id FROM public.doctor_profiles WHERE user_id = auth.uid();
    RETURN v_doctor_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

-- Audit Log Creation
CREATE OR REPLACE FUNCTION public.create_audit_log(
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id TEXT,
    p_outcome TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.audit_logs (actor_user_id, action, resource_type, resource_id, outcome, metadata)
    VALUES (auth.uid(), p_action, p_resource_type, p_resource_id, p_outcome, p_metadata)
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Auth Trigger on auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_requested_role TEXT;
    v_assigned_role TEXT;
    v_specialty_id UUID;
    v_license TEXT;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_requested_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT'));

    IF v_requested_role = 'DOCTOR' THEN
        v_assigned_role := 'DOCTOR';
    ELSE
        v_assigned_role := 'PATIENT';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        role,
        account_status
    ) VALUES (
        NEW.id,
        v_full_name,
        v_phone,
        v_assigned_role,
        'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, profiles.phone);

    IF v_assigned_role = 'DOCTOR' THEN
        v_license := COALESCE(NEW.raw_user_meta_data->>'registration_number', NEW.raw_user_meta_data->>'medical_license');
        IF NEW.raw_user_meta_data->>'specialty' IS NOT NULL THEN
            SELECT id INTO v_specialty_id FROM public.specialties 
            WHERE LOWER(name) = LOWER(NEW.raw_user_meta_data->>'specialty') LIMIT 1;
        END IF;

        INSERT INTO public.doctor_profiles (
            user_id,
            specialty_id,
            qualification,
            registration_number,
            biography,
            verification_status,
            is_public
        ) VALUES (
            NEW.id,
            v_specialty_id,
            COALESCE(NEW.raw_user_meta_data->>'qualification', 'Specialist Physician'),
            v_license,
            COALESCE(NEW.raw_user_meta_data->>'bio', 'Consultant Doctor at MediConnect Hospital.'),
            'PENDING',
            false
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

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

-- Prevent Role Escalation Trigger
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() = OLD.id AND NOT public.is_admin() THEN
        IF NEW.role <> OLD.role THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own security role.';
        END IF;
        IF NEW.account_status <> OLD.account_status THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own account status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- Prevent Slot Overlap Trigger
CREATE OR REPLACE FUNCTION public.check_overlapping_slots()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INT;
BEGIN
    IF NEW.status <> 'CANCELLED' THEN
        SELECT COUNT(*)
        INTO v_conflict_count
        FROM public.availability_slots
        WHERE doctor_id = NEW.doctor_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND status <> 'CANCELLED'
          AND (
              (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
          );

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'Doctor already has an overlapping availability slot during this timeframe.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_slot_overlap ON public.availability_slots;
CREATE TRIGGER trigger_check_slot_overlap
    BEFORE INSERT OR UPDATE ON public.availability_slots
    FOR EACH ROW EXECUTE FUNCTION public.check_overlapping_slots();

-- Atomic Appointment Booking RPC
CREATE OR REPLACE FUNCTION public.book_appointment(
    p_slot_id UUID,
    p_consultation_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_slot RECORD;
    v_appointment_id UUID;
    v_doctor_user_id UUID;
    v_patient_name TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to book an appointment.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller_id AND account_status = 'ACTIVE') THEN
        RAISE EXCEPTION 'Your account is not active. Please contact hospital administration.';
    END IF;

    SELECT full_name INTO v_patient_name FROM public.profiles WHERE id = v_caller_id;

    SELECT * INTO v_slot
    FROM public.availability_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Availability slot not found.';
    END IF;

    IF v_slot.status <> 'AVAILABLE' THEN
        RAISE EXCEPTION 'This slot has already been reserved or is unavailable.';
    END IF;

    IF v_slot.start_time <= timezone('utc', now()) THEN
        RAISE EXCEPTION 'Cannot book an appointment slot that is in the past.';
    END IF;

    SELECT user_id INTO v_doctor_user_id
    FROM public.doctor_profiles
    WHERE id = v_slot.doctor_id;

    UPDATE public.availability_slots
    SET status = 'BOOKED', updated_at = timezone('utc', now())
    WHERE id = p_slot_id;

    INSERT INTO public.appointments (
        patient_id,
        doctor_id,
        slot_id,
        consultation_reason,
        status
    ) VALUES (
        v_caller_id,
        v_slot.doctor_id,
        p_slot_id,
        p_consultation_reason,
        'CONFIRMED'
    ) RETURNING id INTO v_appointment_id;

    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (
        v_caller_id,
        'Appointment Confirmed',
        format('Your consultation is scheduled for %s.', to_char(v_slot.start_time, 'YYYY-MM-DD HH24:MI UTC')),
        'APPOINTMENT',
        v_appointment_id::text
    );

    IF v_doctor_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
        VALUES (
            v_doctor_user_id,
            'New Patient Consultation Scheduled',
            format('Patient %s has booked a consultation for %s.', v_patient_name, to_char(v_slot.start_time, 'YYYY-MM-DD HH24:MI UTC')),
            'APPOINTMENT',
            v_appointment_id::text
        );
    END IF;

    PERFORM public.create_audit_log(
        'APPOINTMENT_BOOKED',
        'APPOINTMENT',
        v_appointment_id::text,
        'SUCCESS',
        jsonb_build_object('slot_id', p_slot_id, 'doctor_id', v_slot.doctor_id, 'patient_id', v_caller_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'status', 'CONFIRMED',
        'slot_id', p_slot_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Atomic Appointment Cancellation RPC
CREATE OR REPLACE FUNCTION public.cancel_appointment(
    p_appointment_id UUID,
    p_cancellation_reason TEXT DEFAULT 'Cancelled by user'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_appt RECORD;
    v_slot RECORD;
    v_doctor_user_id UUID;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.';
    END IF;

    SELECT a.*, d.user_id AS doctor_user_id
    INTO v_appt
    FROM public.appointments a
    JOIN public.doctor_profiles d ON d.id = a.doctor_id
    WHERE a.id = p_appointment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment not found.';
    END IF;

    IF v_appt.patient_id <> v_caller_id AND v_appt.doctor_user_id <> v_caller_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to cancel this appointment.';
    END IF;

    IF v_appt.status IN ('CANCELLED', 'COMPLETED') THEN
        RAISE EXCEPTION 'Appointment is already % and cannot be cancelled.', v_appt.status;
    END IF;

    UPDATE public.appointments
    SET status = 'CANCELLED',
        cancellation_reason = p_cancellation_reason,
        cancelled_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_appointment_id;

    SELECT * INTO v_slot FROM public.availability_slots WHERE id = v_appt.slot_id;
    IF FOUND THEN
        IF v_slot.start_time > timezone('utc', now()) THEN
            UPDATE public.availability_slots
            SET status = 'AVAILABLE', updated_at = timezone('utc', now())
            WHERE id = v_appt.slot_id;
        ELSE
            UPDATE public.availability_slots
            SET status = 'CANCELLED', updated_at = timezone('utc', now())
            WHERE id = v_appt.slot_id;
        END IF;
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (
        v_appt.patient_id,
        'Appointment Cancelled',
        format('Appointment #%s has been cancelled: %s', substring(p_appointment_id::text, 1, 8), p_cancellation_reason),
        'APPOINTMENT',
        p_appointment_id::text
    );

    IF v_appt.doctor_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
        VALUES (
            v_appt.doctor_user_id,
            'Consultation Cancelled',
            format('Scheduled consultation #%s was cancelled.', substring(p_appointment_id::text, 1, 8)),
            'APPOINTMENT',
            p_appointment_id::text
        );
    END IF;

    PERFORM public.create_audit_log(
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT',
        p_appointment_id::text,
        'SUCCESS',
        jsonb_build_object('reason', p_cancellation_reason)
    );

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id, 'status', 'CANCELLED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "profiles_read_own" ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_read_all" ON public.profiles;
CREATE POLICY "profiles_admin_read_all" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "profiles_public_read_approved_doctors" ON public.profiles;
CREATE POLICY "profiles_public_read_approved_doctors" ON public.profiles FOR SELECT USING (
    role = 'DOCTOR' AND id IN (SELECT user_id FROM public.doctor_profiles WHERE verification_status = 'APPROVED' AND is_public = true)
);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_admin_update_all" ON public.profiles;
CREATE POLICY "profiles_admin_update_all" ON public.profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Specialties Policies
DROP POLICY IF EXISTS "specialties_read_public" ON public.specialties;
CREATE POLICY "specialties_read_public" ON public.specialties FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "specialties_admin_insert" ON public.specialties;
CREATE POLICY "specialties_admin_insert" ON public.specialties FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "specialties_admin_update" ON public.specialties;
CREATE POLICY "specialties_admin_update" ON public.specialties FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "specialties_admin_delete" ON public.specialties;
CREATE POLICY "specialties_admin_delete" ON public.specialties FOR DELETE USING (public.is_admin());

-- Doctor Profiles Policies
DROP POLICY IF EXISTS "doctor_profiles_read_approved_public" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_read_approved_public" ON public.doctor_profiles FOR SELECT USING (verification_status = 'APPROVED' AND is_public = true);

DROP POLICY IF EXISTS "doctor_profiles_read_own" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_read_own" ON public.doctor_profiles FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_profiles_admin_read_all" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_admin_read_all" ON public.doctor_profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "doctor_profiles_update_own" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_update_own" ON public.doctor_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "doctor_profiles_admin_update_all" ON public.doctor_profiles;
CREATE POLICY "doctor_profiles_admin_update_all" ON public.doctor_profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Availability Slots Policies
DROP POLICY IF EXISTS "slots_read_public_available" ON public.availability_slots;
CREATE POLICY "slots_read_public_available" ON public.availability_slots FOR SELECT USING (
    status = 'AVAILABLE' 
    AND start_time > timezone('utc', now())
    AND doctor_id IN (SELECT id FROM public.doctor_profiles WHERE verification_status = 'APPROVED' AND is_public = true)
);

DROP POLICY IF EXISTS "slots_doctor_read_own" ON public.availability_slots;
CREATE POLICY "slots_doctor_read_own" ON public.availability_slots FOR SELECT USING (doctor_id = public.get_my_doctor_id() OR public.is_admin());

DROP POLICY IF EXISTS "slots_doctor_insert_own" ON public.availability_slots;
CREATE POLICY "slots_doctor_insert_own" ON public.availability_slots FOR INSERT WITH CHECK (doctor_id = public.get_my_doctor_id() OR public.is_admin());

DROP POLICY IF EXISTS "slots_doctor_update_own" ON public.availability_slots;
CREATE POLICY "slots_doctor_update_own" ON public.availability_slots FOR UPDATE USING (doctor_id = public.get_my_doctor_id() OR public.is_admin()) WITH CHECK (doctor_id = public.get_my_doctor_id() OR public.is_admin());

DROP POLICY IF EXISTS "slots_doctor_delete_own" ON public.availability_slots;
CREATE POLICY "slots_doctor_delete_own" ON public.availability_slots FOR DELETE USING ((doctor_id = public.get_my_doctor_id() AND status <> 'BOOKED') OR public.is_admin());

-- Appointments Policies
DROP POLICY IF EXISTS "appointments_patient_read_own" ON public.appointments;
CREATE POLICY "appointments_patient_read_own" ON public.appointments FOR SELECT USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "appointments_doctor_read_assigned" ON public.appointments;
CREATE POLICY "appointments_doctor_read_assigned" ON public.appointments FOR SELECT USING (doctor_id = public.get_my_doctor_id());

DROP POLICY IF EXISTS "appointments_admin_read_all" ON public.appointments;
CREATE POLICY "appointments_admin_read_all" ON public.appointments FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "appointments_patient_insert_own" ON public.appointments;
CREATE POLICY "appointments_patient_insert_own" ON public.appointments FOR INSERT WITH CHECK (patient_id = auth.uid() AND status IN ('PENDING', 'CONFIRMED'));

DROP POLICY IF EXISTS "appointments_doctor_update_assigned" ON public.appointments;
CREATE POLICY "appointments_doctor_update_assigned" ON public.appointments FOR UPDATE USING (doctor_id = public.get_my_doctor_id()) WITH CHECK (doctor_id = public.get_my_doctor_id());

DROP POLICY IF EXISTS "appointments_patient_update_own" ON public.appointments;
CREATE POLICY "appointments_patient_update_own" ON public.appointments FOR UPDATE USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

DROP POLICY IF EXISTS "appointments_admin_update_all" ON public.appointments;
CREATE POLICY "appointments_admin_update_all" ON public.appointments FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Medical Documents Policies
DROP POLICY IF EXISTS "med_docs_patient_read_own" ON public.medical_documents;
CREATE POLICY "med_docs_patient_read_own" ON public.medical_documents FOR SELECT USING (patient_id = auth.uid());

DROP POLICY IF EXISTS "med_docs_doctor_read_care_patients" ON public.medical_documents;
CREATE POLICY "med_docs_doctor_read_care_patients" ON public.medical_documents FOR SELECT USING (
    patient_id IN (
        SELECT a.patient_id FROM public.appointments a 
        WHERE a.doctor_id = public.get_my_doctor_id() AND a.status IN ('CONFIRMED', 'COMPLETED')
    )
);

DROP POLICY IF EXISTS "med_docs_admin_read_all" ON public.medical_documents;
CREATE POLICY "med_docs_admin_read_all" ON public.medical_documents FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "med_docs_patient_insert_own" ON public.medical_documents;
CREATE POLICY "med_docs_patient_insert_own" ON public.medical_documents FOR INSERT WITH CHECK (patient_id = auth.uid() AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "med_docs_doctor_insert_care" ON public.medical_documents;
CREATE POLICY "med_docs_doctor_insert_care" ON public.medical_documents FOR INSERT WITH CHECK (uploaded_by = auth.uid() AND public.is_doctor());

DROP POLICY IF EXISTS "med_docs_delete_own_or_admin" ON public.medical_documents;
CREATE POLICY "med_docs_delete_own_or_admin" ON public.medical_documents FOR DELETE USING (uploaded_by = auth.uid() OR public.is_admin());

-- Visit Summaries Policies
DROP POLICY IF EXISTS "visit_summaries_patient_read_published" ON public.visit_summaries;
CREATE POLICY "visit_summaries_patient_read_published" ON public.visit_summaries FOR SELECT USING (patient_id = auth.uid() AND is_published = true);

DROP POLICY IF EXISTS "visit_summaries_doctor_read_own" ON public.visit_summaries;
CREATE POLICY "visit_summaries_doctor_read_own" ON public.visit_summaries FOR SELECT USING (doctor_id = public.get_my_doctor_id());

DROP POLICY IF EXISTS "visit_summaries_admin_read_all" ON public.visit_summaries;
CREATE POLICY "visit_summaries_admin_read_all" ON public.visit_summaries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "visit_summaries_doctor_insert_own" ON public.visit_summaries;
CREATE POLICY "visit_summaries_doctor_insert_own" ON public.visit_summaries FOR INSERT WITH CHECK (
    doctor_id = public.get_my_doctor_id() AND appointment_id IN (SELECT id FROM public.appointments WHERE doctor_id = public.get_my_doctor_id())
);

DROP POLICY IF EXISTS "visit_summaries_doctor_update_own" ON public.visit_summaries;
CREATE POLICY "visit_summaries_doctor_update_own" ON public.visit_summaries FOR UPDATE USING (doctor_id = public.get_my_doctor_id()) WITH CHECK (doctor_id = public.get_my_doctor_id());

-- Notifications Policies
DROP POLICY IF EXISTS "notifications_read_own" ON public.notifications;
CREATE POLICY "notifications_read_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- Audit Logs Policies
DROP POLICY IF EXISTS "audit_logs_admin_read_only" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read_only" ON public.audit_logs FOR SELECT USING (public.is_admin());

-- User Preferences Policies
DROP POLICY IF EXISTS "user_preferences_read_own" ON public.user_preferences;
CREATE POLICY "user_preferences_read_own" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. STORAGE BUCKETS & STORAGE OBJECTS RLS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('medical-documents', 'medical-documents', false, 20971520, ARRAY['application/pdf','image/jpeg','image/png','image/webp','text/plain']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "storage_patient_read_own_documents" ON storage.objects;
CREATE POLICY "storage_patient_read_own_documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "storage_doctor_read_care_documents" ON storage.objects;
CREATE POLICY "storage_doctor_read_care_documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'medical-documents' AND EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.doctor_profiles d ON d.id = a.doctor_id
        WHERE d.user_id = auth.uid()
          AND a.patient_id::text = (storage.foldername(storage.objects.name))[1]
          AND a.status IN ('CONFIRMED', 'COMPLETED')
    )
);

DROP POLICY IF EXISTS "storage_admin_read_all_documents" ON storage.objects;
CREATE POLICY "storage_admin_read_all_documents" ON storage.objects FOR SELECT USING (
    bucket_id = 'medical-documents' AND public.is_admin()
);

DROP POLICY IF EXISTS "storage_patient_upload_own_documents" ON storage.objects;
CREATE POLICY "storage_patient_upload_own_documents" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'medical-documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "storage_delete_own_documents" ON storage.objects;
CREATE POLICY "storage_delete_own_documents" ON storage.objects FOR DELETE USING (
    bucket_id = 'medical-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

DROP POLICY IF EXISTS "storage_public_read_avatars" ON storage.objects;
CREATE POLICY "storage_public_read_avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "storage_upload_own_avatar" ON storage.objects;
CREATE POLICY "storage_upload_own_avatar" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "storage_update_own_avatar" ON storage.objects;
CREATE POLICY "storage_update_own_avatar" ON storage.objects FOR UPDATE USING (
    bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "storage_delete_own_avatar" ON storage.objects;
CREATE POLICY "storage_delete_own_avatar" ON storage.objects FOR DELETE USING (
    bucket_id = 'avatars' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- ----------------------------------------------------------------------------
-- 6. DEFAULT SPECIALTIES SEED DATA
-- ----------------------------------------------------------------------------
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
