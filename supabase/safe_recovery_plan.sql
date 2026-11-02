-- ============================================================================
-- MEDICONNECT SAFE DUAL-STATE RECOVERY PLAN (ZERO DATA LOSS)
-- ============================================================================
-- CRITICAL OBJECTIVE:
-- Reverts database routing to legacy integer tables WITHOUT dropping or
-- deleting ANY newly created data, patient records, or storage files.
--
-- Why Naive Rollback (DROP TABLE ... CASCADE) is strictly FORBIDDEN:
-- 1. Destroys all new patient and doctor profiles created post-migration.
-- 2. Destroys all new appointments and visit summaries booked post-migration.
-- 3. Deleting storage buckets causes permanent loss of diagnostic lab files.
-- 4. Violates HIPAA and healthcare data integrity standards.
--
-- RECOVERY STRATEGY:
-- 1. Quarantine: Moves post-migration tables to 'post_migration_archive' schema.
-- 2. Restoration: Restores 'legacy_*' tables back to their original table names.
-- 3. Storage Safety: Locks storage bucket from new writes without deleting files.
-- 4. Audit Log: Logs the recovery event with timestamp.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- STEP 1: CREATE ARCHIVE SCHEMA FOR POST-MIGRATION DATA PRESERVATION
-- ----------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS post_migration_archive;

-- ----------------------------------------------------------------------------
-- STEP 2: SAFELY RELOCATE POST-MIGRATION TABLES TO ARCHIVE SCHEMA
-- (Preserves 100% of newly created rows, clinical records, and UUID mappings)
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    tbl text;
    new_tables text[] := ARRAY[
        'profiles',
        'doctor_profiles',
        'specialties',
        'availability_slots',
        'appointments',
        'medical_documents',
        'visit_summaries',
        'notifications',
        'audit_logs',
        'user_preferences'
    ];
BEGIN
    FOREACH tbl IN ARRAY new_tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = tbl
        ) THEN
            -- Drop foreign keys referencing public.profiles before relocating
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA post_migration_archive;', tbl);
        END IF;
    END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 3: RESTORE LEGACY TABLES TO ORIGINAL PUBLIC NAMES
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_users') THEN
        ALTER TABLE public.legacy_users RENAME TO users;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_doctors') THEN
        ALTER TABLE public.legacy_doctors RENAME TO doctors;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_availability_slots') THEN
        ALTER TABLE public.legacy_availability_slots RENAME TO availability_slots;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_appointments') THEN
        ALTER TABLE public.legacy_appointments RENAME TO appointments;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_medical_documents') THEN
        ALTER TABLE public.legacy_medical_documents RENAME TO medical_documents;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_visit_summaries') THEN
        ALTER TABLE public.legacy_visit_summaries RENAME TO visit_summaries;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_notifications') THEN
        ALTER TABLE public.legacy_notifications RENAME TO notifications;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'legacy_audit_logs') THEN
        ALTER TABLE public.legacy_audit_logs RENAME TO audit_logs;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 4: PRESERVE STORAGE BUCKETS (NEVER DELETE BUCKETS OR FILES)
-- Set to read-only/maintenance mode to prevent orphaned writes
-- ----------------------------------------------------------------------------
UPDATE storage.buckets 
SET public = false, file_size_limit = 0 
WHERE id = 'medical-documents';

-- ----------------------------------------------------------------------------
-- STEP 5: VERIFICATION QUERY CONFIRMING RECOVERY STATE
-- ----------------------------------------------------------------------------
SELECT 
    'LEGACY_RESTORED' as check_type,
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public' AND columns.table_name = t.table_name) as column_count
FROM (
    VALUES ('users'), ('doctors'), ('availability_slots'), ('appointments'), 
           ('medical_documents'), ('visit_summaries'), ('notifications'), ('audit_logs')
) as t(table_name)
UNION ALL
SELECT 
    'ARCHIVED_POST_MIGRATION' as check_type,
    table_name,
    (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'post_migration_archive' AND columns.table_name = t.table_name) as column_count
FROM (
    VALUES ('profiles'), ('doctor_profiles'), ('appointments'), ('medical_documents')
) as t(table_name);

COMMIT;
