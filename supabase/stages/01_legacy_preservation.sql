-- ============================================================================
-- STAGE 1: SAFE PRESERVATION OF EXISTING LEGACY TABLES
-- ============================================================================
-- Objective: Rename existing integer-based legacy tables to legacy_*
-- Guarantee: 100% Non-destructive, idempotent, zero data loss.
-- ============================================================================

BEGIN;

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

-- Post-Stage 1 Verification Query
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'legacy_%'
ORDER BY table_name;

COMMIT;
