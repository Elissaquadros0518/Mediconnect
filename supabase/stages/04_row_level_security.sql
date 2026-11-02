-- ============================================================================
-- STAGE 4: ROW LEVEL SECURITY POLICIES (ZERO TRUST)
-- ============================================================================

BEGIN;

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

-- 1. Profiles Policies
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

-- 2. Specialties Policies
DROP POLICY IF EXISTS "specialties_read_public" ON public.specialties;
CREATE POLICY "specialties_read_public" ON public.specialties FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "specialties_admin_insert" ON public.specialties;
CREATE POLICY "specialties_admin_insert" ON public.specialties FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "specialties_admin_update" ON public.specialties;
CREATE POLICY "specialties_admin_update" ON public.specialties FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "specialties_admin_delete" ON public.specialties;
CREATE POLICY "specialties_admin_delete" ON public.specialties FOR DELETE USING (public.is_admin());

-- 3. Doctor Profiles Policies (Only APPROVED & PUBLIC are publicly searchable)
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

-- 4. Availability Slots Policies
DROP POLICY IF EXISTS "slots_read_public_available" ON public.availability_slots;
CREATE POLICY "slots_read_public_available" ON public.availability_slots FOR SELECT USING (
    status = 'AVAILABLE' AND start_time > timezone('utc', now()) AND doctor_id IN (SELECT id FROM public.doctor_profiles WHERE verification_status = 'APPROVED' AND is_public = true)
);

DROP POLICY IF EXISTS "slots_doctor_read_own" ON public.availability_slots;
CREATE POLICY "slots_doctor_read_own" ON public.availability_slots FOR SELECT USING (doctor_id = public.get_my_doctor_id() OR public.is_admin());

DROP POLICY IF EXISTS "slots_doctor_insert_own" ON public.availability_slots;
CREATE POLICY "slots_doctor_insert_own" ON public.availability_slots FOR INSERT WITH CHECK (doctor_id = public.get_my_doctor_id() OR public.is_admin());

DROP POLICY IF EXISTS "slots_doctor_update_own" ON public.availability_slots;
CREATE POLICY "slots_doctor_update_own" ON public.availability_slots FOR UPDATE USING (doctor_id = public.get_my_doctor_id() OR public.is_admin()) WITH CHECK (doctor_id = public.get_my_doctor_id() OR public.is_admin());

DROP POLICY IF EXISTS "slots_doctor_delete_own" ON public.availability_slots;
CREATE POLICY "slots_doctor_delete_own" ON public.availability_slots FOR DELETE USING ((doctor_id = public.get_my_doctor_id() AND status <> 'BOOKED') OR public.is_admin());

-- 5. Appointments Policies
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

-- 6. Medical Documents Policies (Zero-Trust Patient Records)
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
CREATE POLICY "med_docs_doctor_insert_care" ON public.medical_documents FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() 
    AND public.is_doctor()
    AND (
        patient_id IN (
            SELECT a.patient_id FROM public.appointments a 
            WHERE a.doctor_id = public.get_my_doctor_id()
              AND a.status IN ('CONFIRMED', 'COMPLETED')
        )
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "med_docs_delete_own_or_admin" ON public.medical_documents;
CREATE POLICY "med_docs_delete_own_or_admin" ON public.medical_documents FOR DELETE USING (uploaded_by = auth.uid() OR public.is_admin());

-- 7. Visit Summaries Policies
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

-- 8. Notifications Policies
DROP POLICY IF EXISTS "notifications_read_own" ON public.notifications;
CREATE POLICY "notifications_read_own" ON public.notifications FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications FOR DELETE USING (user_id = auth.uid());

-- 9. Audit Logs Policies
DROP POLICY IF EXISTS "audit_logs_admin_read_only" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_read_only" ON public.audit_logs FOR SELECT USING (public.is_admin());

-- 10. User Preferences Policies
DROP POLICY IF EXISTS "user_preferences_read_own" ON public.user_preferences;
CREATE POLICY "user_preferences_read_own" ON public.user_preferences FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "user_preferences_insert_own" ON public.user_preferences;
CREATE POLICY "user_preferences_insert_own" ON public.user_preferences FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "user_preferences_update_own" ON public.user_preferences;
CREATE POLICY "user_preferences_update_own" ON public.user_preferences FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Post-Stage 4 Verification Query
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;
