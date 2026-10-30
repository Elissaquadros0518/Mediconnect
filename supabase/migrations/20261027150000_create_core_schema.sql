-- ============================================================================
-- Migration: 20261027150000_create_core_schema.sql
-- Description: Core Schema for MediConnect Healthcare Platform
-- Tables: profiles, specialties, doctor_profiles, availability_slots,
--         appointments, medical_documents, visit_summaries, notifications,
--         audit_logs, user_preferences
-- ============================================================================

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Preserve legacy tables non-destructively (NO DROP CASCADE)
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
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_availability_slots') THEN
        ALTER TABLE public.availability_slots RENAME TO legacy_availability_slots;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_appointments') THEN
        ALTER TABLE public.appointments RENAME TO legacy_appointments;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'medical_documents')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_medical_documents') THEN
        ALTER TABLE public.medical_documents RENAME TO legacy_medical_documents;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'visit_summaries')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_visit_summaries') THEN
        ALTER TABLE public.visit_summaries RENAME TO legacy_visit_summaries;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_notifications') THEN
        ALTER TABLE public.notifications RENAME TO legacy_notifications;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs')
       AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_audit_logs') THEN
        ALTER TABLE public.audit_logs RENAME TO legacy_audit_logs;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'PATIENT' CHECK (role IN ('PATIENT', 'DOCTOR', 'ADMIN')),
    avatar_path TEXT,
    account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'DISABLED', 'PENDING')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(account_status);

-- ----------------------------------------------------------------------------
-- 2. SPECIALTIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_specialties_active ON specialties(is_active);

-- ----------------------------------------------------------------------------
-- 3. DOCTOR_PROFILES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE doctor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    specialty_id UUID REFERENCES specialties(id) ON DELETE SET NULL,
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

CREATE INDEX idx_doctor_user_id ON doctor_profiles(user_id);
CREATE INDEX idx_doctor_specialty ON doctor_profiles(specialty_id);
CREATE INDEX idx_doctor_public_approved ON doctor_profiles(is_public, verification_status);

-- ----------------------------------------------------------------------------
-- 4. AVAILABILITY_SLOTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'BOOKED', 'CANCELLED', 'UNAVAILABLE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT check_slot_positive_duration CHECK (end_time > start_time)
);

CREATE INDEX idx_slot_doctor_status_time ON availability_slots(doctor_id, status, start_time);
CREATE INDEX idx_slot_start_time ON availability_slots(start_time);

-- ----------------------------------------------------------------------------
-- 5. APPOINTMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    slot_id UUID NOT NULL UNIQUE REFERENCES availability_slots(id) ON DELETE RESTRICT,
    consultation_reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    cancelled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_appt_patient ON appointments(patient_id);
CREATE INDEX idx_appt_doctor ON appointments(doctor_id);
CREATE INDEX idx_appt_slot ON appointments(slot_id);
CREATE INDEX idx_appt_status ON appointments(status);
CREATE INDEX idx_appt_created ON appointments(created_at DESC);

-- ----------------------------------------------------------------------------
-- 6. MEDICAL_DOCUMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE medical_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    document_type TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0 AND file_size <= 20971520), -- Max 20MB
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_med_doc_patient ON medical_documents(patient_id);
CREATE INDEX idx_med_doc_uploaded_by ON medical_documents(uploaded_by);
CREATE INDEX idx_med_doc_appt ON medical_documents(appointment_id);

-- ----------------------------------------------------------------------------
-- 7. VISIT_SUMMARIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE visit_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    diagnosis TEXT,
    prescribed_medications TEXT,
    follow_up_date DATE,
    prescription_document_id UUID REFERENCES medical_documents(id) ON DELETE SET NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_visit_sum_appt ON visit_summaries(appointment_id);
CREATE INDEX idx_visit_sum_doctor ON visit_summaries(doctor_id);
CREATE INDEX idx_visit_sum_patient ON visit_summaries(patient_id);

-- ----------------------------------------------------------------------------
-- 8. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('APPOINTMENT', 'DOCUMENT', 'SUMMARY', 'SYSTEM', 'SECURITY')),
    read_at TIMESTAMPTZ,
    related_resource_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_notif_user_read ON notifications(user_id, read_at);
CREATE INDEX idx_notif_created ON notifications(created_at DESC);

-- ----------------------------------------------------------------------------
-- 9. AUDIT_LOGS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    outcome TEXT NOT NULL CHECK (outcome IN ('SUCCESS', 'FAILURE', 'DENIED', 'PENDING')),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 10. USER_PREFERENCES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
    preferred_timezone TEXT NOT NULL DEFAULT 'UTC',
    notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "in_app": true, "sms": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX idx_user_prefs_user ON user_preferences(user_id);
