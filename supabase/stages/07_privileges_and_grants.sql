-- ============================================================================
-- STAGE 7: SCHEMA PRIVILEGES, GRANTS & POST-FLIGHT AUDIT
-- ============================================================================

BEGIN;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT SELECT ON public.specialties, public.doctor_profiles, public.profiles, public.availability_slots TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID), public.is_admin(), public.is_doctor() TO anon;

-- Final Verification Query
SELECT 
    'TABLES' as object_type, count(*) as object_count
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('profiles', 'doctor_profiles', 'specialties', 'availability_slots', 'appointments', 'medical_documents', 'visit_summaries', 'notifications', 'audit_logs', 'user_preferences')
UNION ALL
SELECT 
    'POLICIES' as object_type, count(*) as object_count
FROM pg_policies 
WHERE schemaname = 'public'
UNION ALL
SELECT 
    'STORAGE_BUCKETS' as object_type, count(*) as object_count
FROM storage.buckets 
WHERE id IN ('medical-documents', 'avatars');

COMMIT;
