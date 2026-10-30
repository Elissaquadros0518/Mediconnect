-- ============================================================================
-- MEDICONNECT READ-ONLY PREFLIGHT AUDIT SCRIPT
-- ============================================================================
-- SAFETY GUARANTEE:
-- - 100% READ-ONLY (SELECT only).
-- - ZERO table locks, ZERO drops, ZERO data mutations, ZERO risk.
-- - Dynamically checks live schema, legacy tables, row counts, auth users,
--   admin metadata, foreign-key dependencies, and storage buckets.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. LIVE PUBLIC SCHEMA TABLES & PRIMARY KEY TYPES
-- Identifies existing tables and whether they use legacy integer PKs or UUIDs.
-- ----------------------------------------------------------------------------
SELECT 
    t.table_name,
    CASE 
        WHEN t.table_name IN ('users', 'doctors', 'availability_slots', 'appointments', 'medical_documents', 'visit_summaries', 'notifications', 'audit_logs') THEN 'LEGACY_TABLE (To be renamed to legacy_*)'
        WHEN t.table_name LIKE 'legacy_%' THEN 'ALREADY_PRESERVED_LEGACY'
        WHEN t.table_name IN ('profiles', 'doctor_profiles', 'specialties', 'user_preferences') THEN 'POST_MIGRATION_UUID_TABLE'
        ELSE 'OTHER_PUBLIC_TABLE'
    END AS migration_status,
    c.column_name AS pk_column,
    c.data_type AS pk_data_type,
    c.udt_name AS pk_udt_name
FROM information_schema.tables t
LEFT JOIN information_schema.table_constraints tc 
    ON tc.table_schema = t.table_schema 
   AND tc.table_name = t.table_name 
   AND tc.constraint_type = 'PRIMARY KEY'
LEFT JOIN information_schema.key_column_usage kcu 
    ON kcu.constraint_name = tc.constraint_name 
   AND kcu.table_schema = tc.table_schema
LEFT JOIN information_schema.columns c 
    ON c.table_schema = kcu.table_schema 
   AND c.table_name = kcu.table_name 
   AND c.column_name = kcu.column_name
WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
ORDER BY migration_status, t.table_name;

-- ----------------------------------------------------------------------------
-- 2. SAFE EXACT ROW COUNTS FOR ALL EXISTING PUBLIC TABLES
-- Dynamically counts rows without throwing errors if tables do not exist.
-- ----------------------------------------------------------------------------
SELECT 
    table_name,
    (xpath('/row/cnt/text()', query_to_xml(format('SELECT count(*) as cnt FROM %I.%I', table_schema, table_name), false, true, '')))[1]::text::bigint AS exact_row_count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- ----------------------------------------------------------------------------
-- 3. SUPABASE AUTH USER COUNTS & ROLE BREAKDOWN
-- Evaluates existing identities in auth.users and their metadata roles.
-- ----------------------------------------------------------------------------
SELECT 
    count(*) AS total_auth_users,
    count(*) FILTER (WHERE email_confirmed_at IS NOT NULL) AS confirmed_emails,
    count(*) FILTER (WHERE raw_app_meta_data->>'role' = 'ADMIN') AS app_meta_admins,
    count(*) FILTER (WHERE UPPER(COALESCE(raw_user_meta_data->>'role', '')) = 'ADMIN') AS user_meta_admins,
    count(*) FILTER (WHERE UPPER(COALESCE(raw_user_meta_data->>'role', '')) = 'DOCTOR') AS registered_doctors,
    count(*) FILTER (WHERE UPPER(COALESCE(raw_user_meta_data->>'role', '')) = 'PATIENT') AS registered_patients,
    count(*) FILTER (WHERE raw_user_meta_data->>'role' IS NULL AND raw_app_meta_data->>'role' IS NULL) AS unassigned_role_users
FROM auth.users;

-- ----------------------------------------------------------------------------
-- 4. ADMIN METADATA AUDIT
-- Lists accounts claiming or assigned administrative privileges.
-- ----------------------------------------------------------------------------
SELECT 
    id AS user_id,
    email,
    created_at,
    last_sign_in_at,
    raw_app_meta_data->>'role' AS app_metadata_role,
    raw_user_meta_data->>'role' AS user_metadata_role,
    raw_user_meta_data->>'full_name' AS full_name,
    CASE 
        WHEN raw_app_meta_data->>'role' = 'ADMIN' THEN 'AUTHORITATIVE_ADMIN (Secure)'
        WHEN UPPER(COALESCE(raw_user_meta_data->>'role', '')) = 'ADMIN' THEN 'USER_META_ONLY (Requires app_meta elevation)'
        ELSE 'STANDARD_USER'
    END AS admin_authorization_state
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'ADMIN' 
   OR UPPER(COALESCE(raw_user_meta_data->>'role', '')) = 'ADMIN'
ORDER BY created_at ASC;

-- ----------------------------------------------------------------------------
-- 5. FOREIGN-KEY DEPENDENCY AUDIT
-- Inspects all existing foreign keys to identify inter-table dependencies.
-- ----------------------------------------------------------------------------
SELECT 
    tc.table_name AS source_table,
    kcu.column_name AS source_column,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column,
    tc.constraint_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
   AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints rc
    ON rc.constraint_name = tc.constraint_name
   AND rc.constraint_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- ----------------------------------------------------------------------------
-- 6. STORAGE BUCKET & OBJECT AUDIT
-- Checks storage bucket provisioning and existing file assets.
-- ----------------------------------------------------------------------------
SELECT 
    b.id AS bucket_id,
    b.name AS bucket_name,
    b.public AS is_public,
    b.file_size_limit,
    b.allowed_mime_types,
    count(o.id) AS total_objects,
    COALESCE(sum((o.metadata->>'size')::bigint), 0) AS total_bytes
FROM storage.buckets b
LEFT JOIN storage.objects o ON o.bucket_id = b.id
GROUP BY b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types
ORDER BY b.id;

-- ----------------------------------------------------------------------------
-- 7. DATABASE EXTENSIONS & FUNCTIONS
-- Verifies required cryptographic extensions and custom security routines.
-- ----------------------------------------------------------------------------
SELECT 
    'EXTENSION' AS object_type, 
    extname AS object_name, 
    extversion AS details 
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto')
UNION ALL
SELECT 
    'FUNCTION' AS object_type, 
    routine_name AS object_name, 
    data_type AS details 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_role', 'is_admin', 'is_doctor', 'get_my_doctor_id', 'handle_new_user', 'book_appointment')
ORDER BY object_type, object_name;

