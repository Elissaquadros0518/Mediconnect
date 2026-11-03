-- ============================================================================
-- MEDICONNECT CLOUD: AUTHORITATIVE UNIFIED FULL SCHEMA
-- File: supabase/full_schema.sql
-- Description: Authoritative complete database schema, tables, patient profile
--              attributes, doctor-patient RLS, inventory table, storage bucket,
--              atomic RPCs, anti-tampering guards, and seed data.
-- Target Supabase Project: qlfizttqpovyvurkrxvs
-- Safety: Non-destructive, idempotent, zero data loss.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. NON-DESTRUCTIVE LEGACY TABLE PRESERVATION
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

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'availability_slots')
       AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'availability_slots' AND column_name = 'id') = 'integer'
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_availability_slots') THEN
        ALTER TABLE public.availability_slots RENAME TO legacy_availability_slots;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments')
       AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'id') = 'integer'
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_appointments') THEN
        ALTER TABLE public.appointments RENAME TO legacy_appointments;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medical_documents')
       AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'medical_documents' AND column_name = 'id') = 'integer'
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_medical_documents') THEN
        ALTER TABLE public.medical_documents RENAME TO legacy_medical_documents;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visit_summaries')
       AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visit_summaries' AND column_name = 'id') = 'integer'
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_visit_summaries') THEN
        ALTER TABLE public.visit_summaries RENAME TO legacy_visit_summaries;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
       AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'id') = 'integer'
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_notifications') THEN
        ALTER TABLE public.notifications RENAME TO legacy_notifications;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs')
       AND (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'id') = 'integer'
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_audit_logs') THEN
        ALTER TABLE public.audit_logs RENAME TO legacy_audit_logs;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. CORE HEALTHCARE APPLICATION TABLES (UUID BASED)
-- ----------------------------------------------------------------------------

-- A. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'PATIENT' CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    avatar_path TEXT,
    account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'DISABLED', 'PENDING')),
    -- Patient-specific clinical attributes
    date_of_birth DATE,
    gender TEXT,
    blood_group TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_relationship TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    insurance_provider TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(account_status);

DO $$
BEGIN
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_relationship TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS allergies TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS chronic_conditions TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
END $$;

-- B. PATIENT_PROFILES TABLE (Dedicated Clinical Vault)
CREATE TABLE IF NOT EXISTS public.patient_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    date_of_birth DATE,
    gender TEXT,
    blood_group TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_relationship TEXT,
    allergies TEXT,
    chronic_conditions TEXT,
    insurance_provider TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_patient_profiles_user ON public.patient_profiles(user_id);

-- C. SPECIALTIES TABLE
CREATE TABLE IF NOT EXISTS public.specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_specialties_active ON public.specialties(is_active);

-- Seed Specialties
INSERT INTO public.specialties (id, name, description, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111101', 'Cardiology', 'Expert diagnosis, prevention, and treatment of heart conditions.', true),
    ('11111111-1111-1111-1111-111111111102', 'General Medicine', 'Primary healthcare, internal medicine, and preventive medical screenings.', true),
    ('11111111-1111-1111-1111-111111111103', 'Pediatrics', 'Comprehensive healthcare for infants, children, and adolescents.', true),
    ('11111111-1111-1111-1111-111111111104', 'Emergency Care', '24/7 rapid response triage and critical trauma intervention.', true),
    ('11111111-1111-1111-1111-111111111105', 'Neurology', 'Specialized care for neurological disorders, epilepsy, and stroke rehabilitation.', true),
    ('11111111-1111-1111-1111-111111111106', 'Orthopedics', 'Musculoskeletal care, joint reconstruction, and sports medicine.', true),
    ('11111111-1111-1111-1111-111111111107', 'Dermatology', 'Advanced clinical dermatology and skin barrier diagnostics.', true)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    is_active = true;

-- D. DOCTOR_PROFILES TABLE
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

-- E. AVAILABILITY_SLOTS TABLE
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

-- F. APPOINTMENTS TABLE
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

-- G. MEDICAL_DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL DEFAULT 'Diagnostic Report',
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 20971520),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_med_doc_patient ON public.medical_documents(patient_id);

-- H. VISIT_SUMMARIES TABLE
CREATE TABLE IF NOT EXISTS public.visit_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    prescribed_medications TEXT,
    follow_up_date DATE,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_visit_sum_appt ON public.visit_summaries(appointment_id);
CREATE INDEX IF NOT EXISTS idx_visit_sum_patient ON public.visit_summaries(patient_id);
CREATE INDEX IF NOT EXISTS idx_visit_sum_doctor ON public.visit_summaries(doctor_id);

-- I. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'SYSTEM' CHECK (type IN ('APPOINTMENT', 'DOCUMENT', 'SUMMARY', 'SYSTEM', 'PRESCRIPTION', 'ALERT')),
    read_at TIMESTAMPTZ,
    related_resource_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_notif_user ON public.notifications(user_id, read_at, created_at DESC);

-- J. AUDIT_LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'DENIED', 'FAILURE')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- K. USER_PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- L. INVENTORY_ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Pharmaceuticals',
    dosage_form TEXT,
    quantity_in_stock INT NOT NULL DEFAULT 0 CHECK (quantity_in_stock >= 0),
    reorder_level INT NOT NULL DEFAULT 20 CHECK (reorder_level >= 0),
    unit_of_measure TEXT NOT NULL DEFAULT 'Units',
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (unit_price >= 0),
    expiry_date DATE,
    supplier_name TEXT,
    storage_location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON public.inventory_items(sku);

-- Seed Hospital Inventory
INSERT INTO public.inventory_items (sku, name, category, dosage_form, quantity_in_stock, reorder_level, unit_of_measure, unit_price, expiry_date, supplier_name, storage_location)
VALUES
    ('MED-AMX-500', 'Amoxicillin 500mg Capsules', 'Pharmaceuticals', '500mg Oral Capsule', 120, 50, 'Boxes (100s)', 320.00, '2027-08-15', 'Apex Pharma Labs', 'Pharmacy Bay A-12'),
    ('MED-PRC-650', 'Paracetamol 650mg Tablets', 'Pharmaceuticals', '650mg Antipyretic Tablet', 450, 150, 'Strips (15s)', 45.00, '2028-02-10', 'Cipla Health', 'Pharmacy Bay A-04'),
    ('MED-ATV-020', 'Atorvastatin 20mg Tablets', 'Pharmaceuticals', '20mg Lipid Lowering', 210, 80, 'Strips (10s)', 110.00, '2027-11-20', 'Sun Pharma', 'Pharmacy Bay B-08'),
    ('SUR-GLV-002', 'Sterile Surgical Gloves (Size 7.5)', 'Surgical Supplies', 'Size 7.5 Powder-Free Latex', 85, 50, 'Pairs (Box 50)', 450.00, '2028-05-30', 'MediGlove International', 'OT Sterile Supply S-02'),
    ('SUR-SUT-300', 'Polyglactin Suture 3-0 with Needle', 'Surgical Supplies', 'Absorbable Braided Suture 70cm', 40, 25, 'Box (12 Sutures)', 1250.00, '2027-04-18', 'Ethicon Surgical', 'OT Sterile Supply S-05'),
    ('DIA-GLU-100', 'Blood Glucose Test Strips', 'Diagnostic Equipment', 'Electrochemical Capillary Strips', 95, 40, 'Vials (50 Strips)', 780.00, '2026-12-31', 'Accu-Chek Diagnostics', 'Lab Refrigerator L-03'),
    ('DIA-ECG-050', 'ECG Thermal Recording Paper Rolls', 'Diagnostic Equipment', '210mm x 295mm Grid Rolls', 65, 25, 'Rolls', 240.00, '2029-10-10', 'BPL Medical Tech', 'Cardiology Store C-01'),
    ('PPE-MSK-N95', 'N95 Particulate Respirator Masks', 'PPE & Consumables', 'NIOSH Certified 5-Ply', 500, 100, 'Pack (20 Masks)', 350.00, '2028-09-01', '3M Healthcare', 'Central Store Bay E-02')
ON CONFLICT (sku) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 4. FUNCTIONS & STORED PROCEDURES
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_role, 'ANONYMOUS');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.get_my_doctor_id()
RETURNS UUID AS $$
DECLARE
    v_doctor_id UUID;
BEGIN
    SELECT id INTO v_doctor_id FROM public.doctor_profiles WHERE user_id = auth.uid();
    RETURN v_doctor_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- book_appointment (Atomic slot locking & validation)
CREATE OR REPLACE FUNCTION public.book_appointment(
    p_slot_id UUID,
    p_consultation_reason TEXT DEFAULT 'General Specialist Consultation'
)
RETURNS JSONB AS $$
DECLARE
    v_patient_id UUID := auth.uid();
    v_doctor_id UUID;
    v_slot_status TEXT;
    v_appointment_id UUID;
    v_doctor_user_id UUID;
BEGIN
    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to book a consultation.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_patient_id AND account_status = 'ACTIVE') THEN
        RAISE EXCEPTION 'Patient account is inactive or profile does not exist.';
    END IF;

    SELECT doctor_id, status INTO v_doctor_id, v_slot_status
    FROM public.availability_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Consultation slot not found.';
    END IF;

    IF v_slot_status <> 'AVAILABLE' THEN
        RAISE EXCEPTION 'Selected consultation slot is no longer available.';
    END IF;

    SELECT user_id INTO v_doctor_user_id
    FROM public.doctor_profiles
    WHERE id = v_doctor_id AND verification_status = 'APPROVED' AND is_public = true;

    IF v_doctor_user_id IS NULL THEN
        RAISE EXCEPTION 'Physician is not currently accepting public bookings.';
    END IF;

    UPDATE public.availability_slots
    SET status = 'BOOKED', updated_at = timezone('utc', now())
    WHERE id = p_slot_id;

    INSERT INTO public.appointments (
        patient_id,
        doctor_id,
        slot_id,
        consultation_reason,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_patient_id,
        v_doctor_id,
        p_slot_id,
        p_consultation_reason,
        'CONFIRMED',
        timezone('utc', now()),
        timezone('utc', now())
    ) RETURNING id INTO v_appointment_id;

    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_resource_id
    ) VALUES (
        v_doctor_user_id,
        'New Patient Appointment Confirmed',
        format('A patient has confirmed a consultation for %s.', p_consultation_reason),
        'APPOINTMENT',
        v_appointment_id::text
    );

    PERFORM public.create_audit_log('APPOINTMENT_BOOKED', 'APPOINTMENT', v_appointment_id::text, 'SUCCESS', jsonb_build_object('slot_id', p_slot_id, 'doctor_id', v_doctor_id));

    RETURN jsonb_build_object('success', true, 'appointment_id', v_appointment_id, 'status', 'CONFIRMED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- cancel_appointment
CREATE OR REPLACE FUNCTION public.cancel_appointment(
    p_appointment_id UUID,
    p_cancellation_reason TEXT DEFAULT 'Cancelled by user'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_appt RECORD;
    v_slot RECORD;
BEGIN
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

    IF v_appt.status IN ('CANCELLED', 'REJECTED', 'COMPLETED') THEN
        RAISE EXCEPTION 'Appointment is already finalized with status %.', v_appt.status;
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

    IF v_caller_id = v_appt.patient_id THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
        VALUES (v_appt.doctor_user_id, 'Consultation Cancelled by Patient', format('Reason: %s', p_cancellation_reason), 'APPOINTMENT', p_appointment_id::text);
    ELSE
        INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
        VALUES (v_appt.patient_id, 'Consultation Cancelled by Physician', format('Reason: %s', p_cancellation_reason), 'APPOINTMENT', p_appointment_id::text);
    END IF;

    PERFORM public.create_audit_log('APPOINTMENT_CANCELLED', 'APPOINTMENT', p_appointment_id::text, 'SUCCESS', jsonb_build_object('reason', p_cancellation_reason));

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id, 'status', 'CANCELLED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- reject_appointment
CREATE OR REPLACE FUNCTION public.reject_appointment(
    p_appointment_id UUID,
    p_rejection_reason TEXT DEFAULT 'Declined by physician'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_appt RECORD;
    v_slot RECORD;
BEGIN
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

    IF v_appt.doctor_user_id <> v_caller_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to reject this appointment.';
    END IF;

    UPDATE public.appointments
    SET status = 'REJECTED',
        cancellation_reason = p_rejection_reason,
        cancelled_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_appointment_id;

    SELECT * INTO v_slot FROM public.availability_slots WHERE id = v_appt.slot_id;
    IF FOUND AND v_slot.start_time > timezone('utc', now()) THEN
        UPDATE public.availability_slots
        SET status = 'AVAILABLE', updated_at = timezone('utc', now())
        WHERE id = v_appt.slot_id;
    END IF;

    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (v_appt.patient_id, 'Consultation Request Declined', format('Your request was declined: %s', p_rejection_reason), 'APPOINTMENT', p_appointment_id::text);

    PERFORM public.create_audit_log('APPOINTMENT_REJECTED', 'APPOINTMENT', p_appointment_id::text, 'SUCCESS', jsonb_build_object('reason', p_rejection_reason));

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id, 'status', 'REJECTED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- complete_appointment
CREATE OR REPLACE FUNCTION public.complete_appointment(
    p_appointment_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID := auth.uid();
    v_appt RECORD;
BEGIN
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

    IF v_appt.doctor_user_id <> v_caller_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to complete this consultation.';
    END IF;

    UPDATE public.appointments
    SET status = 'COMPLETED',
        completed_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_appointment_id;

    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (v_appt.patient_id, 'Consultation Completed', 'Your consultation has been marked completed by your physician.', 'APPOINTMENT', p_appointment_id::text);

    PERFORM public.create_audit_log('APPOINTMENT_COMPLETED', 'APPOINTMENT', p_appointment_id::text, 'SUCCESS', '{}'::jsonb);

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id, 'status', 'COMPLETED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- ----------------------------------------------------------------------------
-- 5. TRIGGERS & INTEGRITY GUARDS
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_patient_profiles_updated_at ON public.patient_profiles;
CREATE TRIGGER trigger_patient_profiles_updated_at BEFORE UPDATE ON public.patient_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_doctor_profiles_updated_at ON public.doctor_profiles;
CREATE TRIGGER trigger_doctor_profiles_updated_at BEFORE UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_availability_slots_updated_at ON public.availability_slots;
CREATE TRIGGER trigger_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON public.appointments;
CREATE TRIGGER trigger_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_visit_summaries_updated_at ON public.visit_summaries;
CREATE TRIGGER trigger_visit_summaries_updated_at BEFORE UPDATE ON public.visit_summaries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_inventory_items_updated_at ON public.inventory_items;
CREATE TRIGGER trigger_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Prevent Overlapping Availability Slots
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

-- Prevent Role Escalation Trigger
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
CREATE TRIGGER trigger_prevent_role_escalation BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- Prevent Doctor Self-Verification Trigger
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
CREATE TRIGGER trigger_prevent_doctor_self_verification BEFORE INSERT OR UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.prevent_doctor_self_verification();

-- New User Registration Trigger
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
    v_dob DATE;
    v_emergency_phone TEXT;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_requested_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT'));

    IF v_requested_role = 'DOCTOR' THEN
        v_assigned_role := 'DOCTOR';
    ELSE
        v_assigned_role := 'PATIENT';
    END IF;

    IF NEW.raw_user_meta_data->>'dob' IS NOT NULL AND NEW.raw_user_meta_data->>'dob' <> '' THEN
        BEGIN
            v_dob := (NEW.raw_user_meta_data->>'dob')::date;
        EXCEPTION WHEN OTHERS THEN
            v_dob := NULL;
        END;
    END IF;
    v_emergency_phone := NEW.raw_user_meta_data->>'emergencyContact';

    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        role,
        account_status,
        date_of_birth,
        emergency_contact_phone,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        v_full_name,
        v_phone,
        v_assigned_role,
        'ACTIVE',
        v_dob,
        v_emergency_phone,
        timezone('utc', now()),
        timezone('utc', now())
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        date_of_birth = COALESCE(EXCLUDED.date_of_birth, public.profiles.date_of_birth),
        emergency_contact_phone = COALESCE(EXCLUDED.emergency_contact_phone, public.profiles.emergency_contact_phone),
        updated_at = timezone('utc', now());

    IF v_assigned_role = 'DOCTOR' THEN
        v_license := COALESCE(
            NEW.raw_user_meta_data->>'registration_number',
            NEW.raw_user_meta_data->>'medical_license',
            NEW.raw_user_meta_data->>'medicalLicense',
            'MCI-REG-' || UPPER(SUBSTRING(NEW.id::text, 1, 8))
        );
        v_qualification := COALESCE(NEW.raw_user_meta_data->>'qualification', 'Specialist Physician');

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
            biography,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            v_specialty_id,
            v_qualification,
            v_license,
            COALESCE((NEW.raw_user_meta_data->>'experience_years')::int, 5),
            COALESCE((NEW.raw_user_meta_data->>'consultation_fee')::numeric, 1000.00),
            'PENDING',
            false,
            COALESCE(NEW.raw_user_meta_data->>'bio', 'Consultant Doctor at MediConnect Hospital.'),
            timezone('utc', now()),
            timezone('utc', now())
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    IF v_assigned_role = 'PATIENT' THEN
        INSERT INTO public.patient_profiles (
            user_id,
            date_of_birth,
            emergency_contact_phone,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            v_dob,
            v_emergency_phone,
            timezone('utc', now()),
            timezone('utc', now())
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    PERFORM public.create_audit_log('USER_REGISTERED', 'AUTH', NEW.id::text, 'SUCCESS', jsonb_build_object('role', v_assigned_role, 'email', NEW.email));

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- PROFILES
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_select_admin" ON public.profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "profiles_select_public_doctors" ON public.profiles FOR SELECT USING (
    role = 'DOCTOR' AND EXISTS (
        SELECT 1 FROM public.doctor_profiles dp
        WHERE dp.user_id = profiles.id AND dp.verification_status = 'APPROVED' AND dp.is_public = true
    )
);
CREATE POLICY "profiles_select_doctor_care_relationship" ON public.profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
        WHERE dp.user_id = auth.uid() AND a.patient_id = profiles.id
    )
);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_admin" ON public.profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- PATIENT_PROFILES
CREATE POLICY "patient_profiles_select_own" ON public.patient_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "patient_profiles_select_doctor" ON public.patient_profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
        WHERE dp.user_id = auth.uid() AND a.patient_id = patient_profiles.user_id
    )
);
CREATE POLICY "patient_profiles_select_admin" ON public.patient_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "patient_profiles_update_own" ON public.patient_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "patient_profiles_update_admin" ON public.patient_profiles FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "patient_profiles_insert_own" ON public.patient_profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- SPECIALTIES
CREATE POLICY "specialties_select_all" ON public.specialties FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "specialties_admin_all" ON public.specialties FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DOCTOR_PROFILES
CREATE POLICY "doctor_profiles_select_public" ON public.doctor_profiles FOR SELECT USING (verification_status = 'APPROVED' AND is_public = true);
CREATE POLICY "doctor_profiles_select_own" ON public.doctor_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "doctor_profiles_select_admin" ON public.doctor_profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "doctor_profiles_update_own" ON public.doctor_profiles FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "doctor_profiles_admin_all" ON public.doctor_profiles FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "doctor_profiles_insert_authenticated" ON public.doctor_profiles FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- AVAILABILITY_SLOTS
CREATE POLICY "slots_select_public" ON public.availability_slots FOR SELECT USING (
    (status = 'AVAILABLE' AND EXISTS (
        SELECT 1 FROM public.doctor_profiles dp
        WHERE dp.id = availability_slots.doctor_id AND dp.verification_status = 'APPROVED' AND dp.is_public = true
    ))
    OR doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
    OR public.is_admin()
);
CREATE POLICY "slots_doctor_insert_own" ON public.availability_slots FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "slots_doctor_update_own" ON public.availability_slots FOR UPDATE USING (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()) OR public.is_admin()
) WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "slots_doctor_delete_own" ON public.availability_slots FOR DELETE USING (
    (status = 'AVAILABLE' AND doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())) OR public.is_admin()
);

-- APPOINTMENTS
CREATE POLICY "appointments_select_patient" ON public.appointments FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "appointments_select_doctor" ON public.appointments FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "appointments_select_admin" ON public.appointments FOR SELECT USING (public.is_admin());
CREATE POLICY "appointments_insert_patient" ON public.appointments FOR INSERT WITH CHECK (patient_id = auth.uid() OR public.is_admin());
CREATE POLICY "appointments_update_doctor" ON public.appointments FOR UPDATE USING (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()) OR public.is_admin()
) WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "appointments_update_patient_cancel" ON public.appointments FOR UPDATE USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid() AND status = 'CANCELLED');

-- MEDICAL_DOCUMENTS
CREATE POLICY "documents_select_patient" ON public.medical_documents FOR SELECT USING (patient_id = auth.uid());
CREATE POLICY "documents_select_doctor_care_relationship" ON public.medical_documents FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
        WHERE dp.user_id = auth.uid() AND a.patient_id = medical_documents.patient_id
    )
);
CREATE POLICY "documents_select_admin" ON public.medical_documents FOR SELECT USING (public.is_admin());
CREATE POLICY "documents_insert_authorized" ON public.medical_documents FOR INSERT WITH CHECK (
    patient_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
        WHERE dp.user_id = auth.uid() AND a.patient_id = medical_documents.patient_id
    )
);
CREATE POLICY "documents_delete_own_or_admin" ON public.medical_documents FOR DELETE USING (patient_id = auth.uid() OR public.is_admin());

-- VISIT_SUMMARIES
CREATE POLICY "summaries_select_patient" ON public.visit_summaries FOR SELECT USING (patient_id = auth.uid() AND (is_published = true OR public.is_admin()));
CREATE POLICY "summaries_select_doctor" ON public.visit_summaries FOR SELECT USING (doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()));
CREATE POLICY "summaries_select_admin" ON public.visit_summaries FOR SELECT USING (public.is_admin());
CREATE POLICY "summaries_doctor_insert" ON public.visit_summaries FOR INSERT WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);
CREATE POLICY "summaries_doctor_update" ON public.visit_summaries FOR UPDATE USING (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()) OR public.is_admin()
) WITH CHECK (
    doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid()) OR public.is_admin()
);

-- NOTIFICATIONS
CREATE POLICY "notifications_select_own" ON public.notifications FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "notifications_insert_system" ON public.notifications FOR INSERT WITH CHECK (true);

-- AUDIT_LOGS
CREATE POLICY "audit_select_own" ON public.audit_logs FOR SELECT USING (actor_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "audit_admin_all" ON public.audit_logs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "audit_insert_any" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- USER_PREFERENCES
CREATE POLICY "preferences_all_own" ON public.user_preferences FOR ALL USING (user_id = auth.uid() OR public.is_admin()) WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- INVENTORY_ITEMS
CREATE POLICY "inventory_select_authenticated" ON public.inventory_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "inventory_admin_insert" ON public.inventory_items FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "inventory_admin_update" ON public.inventory_items FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "inventory_admin_delete" ON public.inventory_items FOR DELETE USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. STORAGE CONFIGURATION FOR MEDICAL DOCUMENTS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'medical-documents',
    'medical-documents',
    false,
    20971520,
    ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']::text[];

DROP POLICY IF EXISTS "storage_patient_read_own_files" ON storage.objects;
CREATE POLICY "storage_patient_read_own_files" ON storage.objects FOR SELECT USING (
    bucket_id = 'medical-documents'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.appointments a
            JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
            WHERE dp.user_id = auth.uid() AND a.patient_id::text = (storage.foldername(name))[1]
        )
    )
);

DROP POLICY IF EXISTS "storage_patient_insert_own_files" ON storage.objects;
CREATE POLICY "storage_patient_insert_own_files" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'medical-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

DROP POLICY IF EXISTS "storage_patient_delete_own_files" ON storage.objects;
CREATE POLICY "storage_patient_delete_own_files" ON storage.objects FOR DELETE USING (
    bucket_id = 'medical-documents'
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- ----------------------------------------------------------------------------
-- 8. PERMISSIONS & SCHEMA API GRANTS
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.specialties, public.profiles, public.doctor_profiles, public.availability_slots TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

COMMIT;
