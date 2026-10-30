-- ============================================================================
-- Migration: 20261027150300_create_storage_configuration.sql
-- Description: Provision Storage Buckets and Objects RLS Security Policies
-- Buckets:
--   1. medical-documents (Private, strictly zero-trust encrypted patient records)
--   2. avatars (Public profile images)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE STORAGE BUCKETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'medical-documents',
    'medical-documents',
    false, -- STRICTLY PRIVATE
    20971520, -- 20 MB limit
    ARRAY[
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'text/plain'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['application/pdf','image/jpeg','image/png','image/webp','text/plain'];

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true, -- Public for avatar previews
    5242880, -- 5 MB limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'];

-- ----------------------------------------------------------------------------
-- 2. STORAGE POLICIES: MEDICAL-DOCUMENTS (PRIVATE ZERO-TRUST)
-- ----------------------------------------------------------------------------
-- A. Patient read own files (folder name matches auth.uid)
DROP POLICY IF EXISTS "storage_patient_read_own_documents" ON storage.objects;
CREATE POLICY "storage_patient_read_own_documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'medical-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- B. Attending Doctor read files of patient with confirmed or completed appointment
DROP POLICY IF EXISTS "storage_doctor_read_care_documents" ON storage.objects;
CREATE POLICY "storage_doctor_read_care_documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'medical-documents'
        AND EXISTS (
            SELECT 1 FROM public.appointments a
            JOIN public.doctor_profiles d ON d.id = a.doctor_id
            WHERE d.user_id = auth.uid()
              AND a.patient_id::text = (storage.foldername(storage.objects.name))[1]
              AND a.status IN ('CONFIRMED', 'COMPLETED')
        )
    );

-- C. Admin read all medical documents
DROP POLICY IF EXISTS "storage_admin_read_all_documents" ON storage.objects;
CREATE POLICY "storage_admin_read_all_documents"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'medical-documents'
        AND public.is_admin()
    );

-- D. Patient upload file into own directory
DROP POLICY IF EXISTS "storage_patient_upload_own_documents" ON storage.objects;
CREATE POLICY "storage_patient_upload_own_documents"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'medical-documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- E. Delete own files
DROP POLICY IF EXISTS "storage_delete_own_documents" ON storage.objects;
CREATE POLICY "storage_delete_own_documents"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'medical-documents'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );

-- ----------------------------------------------------------------------------
-- 3. STORAGE POLICIES: AVATARS (PUBLIC)
-- ----------------------------------------------------------------------------
-- A. Public read avatars
DROP POLICY IF EXISTS "storage_public_read_avatars" ON storage.objects;
CREATE POLICY "storage_public_read_avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

-- B. Authenticated user upload own avatar
DROP POLICY IF EXISTS "storage_upload_own_avatar" ON storage.objects;
CREATE POLICY "storage_upload_own_avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- C. Authenticated user update own avatar
DROP POLICY IF EXISTS "storage_update_own_avatar" ON storage.objects;
CREATE POLICY "storage_update_own_avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- D. Authenticated user delete own avatar
DROP POLICY IF EXISTS "storage_delete_own_avatar" ON storage.objects;
CREATE POLICY "storage_delete_own_avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars'
        AND (
            (storage.foldername(name))[1] = auth.uid()::text
            OR public.is_admin()
        )
    );
