-- ============================================================================
-- STAGE 5: STORAGE BUCKETS & STORAGE OBJECTS RLS
-- ============================================================================

BEGIN;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('medical-documents', 'medical-documents', false, 20971520, ARRAY['application/pdf','image/jpeg','image/png','image/webp','text/plain']),
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Medical Documents Policies
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

DROP POLICY IF EXISTS "storage_doctor_upload_care_documents" ON storage.objects;
CREATE POLICY "storage_doctor_upload_care_documents" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'medical-documents' 
    AND public.is_doctor()
    AND EXISTS (
        SELECT 1 FROM public.appointments a
        JOIN public.doctor_profiles d ON d.id = a.doctor_id
        WHERE d.user_id = auth.uid()
          AND a.patient_id::text = (storage.foldername(storage.objects.name))[1]
          AND a.status IN ('CONFIRMED', 'COMPLETED')
    )
);

DROP POLICY IF EXISTS "storage_delete_own_documents" ON storage.objects;
CREATE POLICY "storage_delete_own_documents" ON storage.objects FOR DELETE USING (
    bucket_id = 'medical-documents' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- Avatars Policies
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

-- Post-Stage 5 Verification Query
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('medical-documents', 'avatars');

COMMIT;
