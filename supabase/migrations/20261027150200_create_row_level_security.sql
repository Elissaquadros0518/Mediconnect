-- ============================================================================
-- Migration: 20261027150200_create_row_level_security.sql
-- Description: Enable Row Level Security (RLS) and implement robust access policies
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENABLE RLS ON ALL APPLICATION TABLES
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

-- ----------------------------------------------------------------------------
-- 2. POLICIES FOR PROFILES
-- ----------------------------------------------------------------------------
-- A. Self profile read
CREATE POLICY "profiles_read_own"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- B. Admin profile read
CREATE POLICY "profiles_admin_read_all"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

-- C. Public read for active doctors
CREATE POLICY "profiles_public_read_approved_doctors"
    ON public.profiles FOR SELECT
    USING (
        role = 'DOCTOR' 
        AND id IN (
            SELECT user_id FROM public.doctor_profiles 
            WHERE verification_status = 'APPROVED' AND is_public = true
        )
    );

-- D. Self profile update (role escalation guarded by trigger)
CREATE POLICY "profiles_update_own"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- E. Admin profile update
CREATE POLICY "profiles_admin_update_all"
    ON public.profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 3. POLICIES FOR SPECIALTIES
-- ----------------------------------------------------------------------------
-- A. Public read active specialties
CREATE POLICY "specialties_read_public"
    ON public.specialties FOR SELECT
    USING (is_active = true OR public.is_admin());

-- B. Admin management
CREATE POLICY "specialties_admin_insert"
    ON public.specialties FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "specialties_admin_update"
    ON public.specialties FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "specialties_admin_delete"
    ON public.specialties FOR DELETE
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 4. POLICIES FOR DOCTOR_PROFILES
-- ----------------------------------------------------------------------------
-- A. Public can read approved and public profiles
CREATE POLICY "doctor_profiles_read_approved_public"
    ON public.doctor_profiles FOR SELECT
    USING (verification_status = 'APPROVED' AND is_public = true);

-- B. Doctors can read their own profile even if pending
CREATE POLICY "doctor_profiles_read_own"
    ON public.doctor_profiles FOR SELECT
    USING (user_id = auth.uid());

-- C. Admins can read all doctor profiles
CREATE POLICY "doctor_profiles_admin_read_all"
    ON public.doctor_profiles FOR SELECT
    USING (public.is_admin());

-- D. Doctors can update their own professional fields
CREATE POLICY "doctor_profiles_update_own"
    ON public.doctor_profiles FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- E. Admins can update any doctor profile (e.g. approve / verify)
CREATE POLICY "doctor_profiles_admin_update_all"
    ON public.doctor_profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. POLICIES FOR AVAILABILITY_SLOTS
-- ----------------------------------------------------------------------------
-- A. Public read for available slots of approved doctors
CREATE POLICY "slots_read_public_available"
    ON public.availability_slots FOR SELECT
    USING (
        status = 'AVAILABLE' 
        AND start_time > timezone('utc', now())
        AND doctor_id IN (
            SELECT id FROM public.doctor_profiles 
            WHERE verification_status = 'APPROVED' AND is_public = true
        )
    );

-- B. Doctor read own slots
CREATE POLICY "slots_doctor_read_own"
    ON public.availability_slots FOR SELECT
    USING (doctor_id = public.get_my_doctor_id() OR public.is_admin());

-- C. Doctor insert own slots
CREATE POLICY "slots_doctor_insert_own"
    ON public.availability_slots FOR INSERT
    WITH CHECK (
        doctor_id = public.get_my_doctor_id()
        OR public.is_admin()
    );

-- D. Doctor update own slots
CREATE POLICY "slots_doctor_update_own"
    ON public.availability_slots FOR UPDATE
    USING (doctor_id = public.get_my_doctor_id() OR public.is_admin())
    WITH CHECK (doctor_id = public.get_my_doctor_id() OR public.is_admin());

-- E. Doctor delete own slots (only if not already booked)
CREATE POLICY "slots_doctor_delete_own"
    ON public.availability_slots FOR DELETE
    USING (
        (doctor_id = public.get_my_doctor_id() AND status <> 'BOOKED')
        OR public.is_admin()
    );

-- ----------------------------------------------------------------------------
-- 6. POLICIES FOR APPOINTMENTS
-- ----------------------------------------------------------------------------
-- A. Patient read own appointments
CREATE POLICY "appointments_patient_read_own"
    ON public.appointments FOR SELECT
    USING (patient_id = auth.uid());

-- B. Doctor read assigned appointments
CREATE POLICY "appointments_doctor_read_assigned"
    ON public.appointments FOR SELECT
    USING (doctor_id = public.get_my_doctor_id());

-- C. Admin read all appointments
CREATE POLICY "appointments_admin_read_all"
    ON public.appointments FOR SELECT
    USING (public.is_admin());

-- D. Patient insert appointment (only for themselves)
CREATE POLICY "appointments_patient_insert_own"
    ON public.appointments FOR INSERT
    WITH CHECK (
        patient_id = auth.uid()
        AND status IN ('PENDING', 'CONFIRMED')
    );

-- E. Doctor update assigned appointments (e.g. status transition)
CREATE POLICY "appointments_doctor_update_assigned"
    ON public.appointments FOR UPDATE
    USING (doctor_id = public.get_my_doctor_id())
    WITH CHECK (doctor_id = public.get_my_doctor_id());

-- F. Patient update own appointment (e.g. cancellation)
CREATE POLICY "appointments_patient_update_own"
    ON public.appointments FOR UPDATE
    USING (patient_id = auth.uid())
    WITH CHECK (patient_id = auth.uid());

-- G. Admin update any appointment
CREATE POLICY "appointments_admin_update_all"
    ON public.appointments FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. POLICIES FOR MEDICAL_DOCUMENTS
-- ----------------------------------------------------------------------------
-- A. Patient can read their own documents
CREATE POLICY "med_docs_patient_read_own"
    ON public.medical_documents FOR SELECT
    USING (patient_id = auth.uid());

-- B. Doctor can read documents of patients who have an active or completed appointment
CREATE POLICY "med_docs_doctor_read_care_patients"
    ON public.medical_documents FOR SELECT
    USING (
        patient_id IN (
            SELECT a.patient_id FROM public.appointments a 
            WHERE a.doctor_id = public.get_my_doctor_id()
              AND a.status IN ('CONFIRMED', 'COMPLETED')
        )
    );

-- C. Admin can read all medical documents
CREATE POLICY "med_docs_admin_read_all"
    ON public.medical_documents FOR SELECT
    USING (public.is_admin());

-- D. Patient can upload documents for themselves
CREATE POLICY "med_docs_patient_insert_own"
    ON public.medical_documents FOR INSERT
    WITH CHECK (
        patient_id = auth.uid() 
        AND uploaded_by = auth.uid()
    );

-- E. Doctor can upload documents for an appointment
CREATE POLICY "med_docs_doctor_insert_care"
    ON public.medical_documents FOR INSERT
    WITH CHECK (
        uploaded_by = auth.uid()
        AND public.is_doctor()
    );

-- F. Deletion restricted to uploader or admin
CREATE POLICY "med_docs_delete_own_or_admin"
    ON public.medical_documents FOR DELETE
    USING (uploaded_by = auth.uid() OR public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. POLICIES FOR VISIT_SUMMARIES
-- ----------------------------------------------------------------------------
-- A. Patient can view published summaries for their own consultations
CREATE POLICY "visit_summaries_patient_read_published"
    ON public.visit_summaries FOR SELECT
    USING (patient_id = auth.uid() AND is_published = true);

-- B. Doctor can view all summaries they created (drafts + published)
CREATE POLICY "visit_summaries_doctor_read_own"
    ON public.visit_summaries FOR SELECT
    USING (doctor_id = public.get_my_doctor_id());

-- C. Admin can view all summaries
CREATE POLICY "visit_summaries_admin_read_all"
    ON public.visit_summaries FOR SELECT
    USING (public.is_admin());

-- D. Doctor can insert summary for an authorized consultation
CREATE POLICY "visit_summaries_doctor_insert_own"
    ON public.visit_summaries FOR INSERT
    WITH CHECK (
        doctor_id = public.get_my_doctor_id()
        AND appointment_id IN (
            SELECT id FROM public.appointments WHERE doctor_id = public.get_my_doctor_id()
        )
    );

-- E. Doctor can update summary for their consultation
CREATE POLICY "visit_summaries_doctor_update_own"
    ON public.visit_summaries FOR UPDATE
    USING (doctor_id = public.get_my_doctor_id())
    WITH CHECK (doctor_id = public.get_my_doctor_id());

-- ----------------------------------------------------------------------------
-- 9. POLICIES FOR NOTIFICATIONS
-- ----------------------------------------------------------------------------
-- A. User can read only their own notifications
CREATE POLICY "notifications_read_own"
    ON public.notifications FOR SELECT
    USING (user_id = auth.uid());

-- B. User can update (mark as read) only their own notifications
CREATE POLICY "notifications_update_own"
    ON public.notifications FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- C. User can delete their own notifications
CREATE POLICY "notifications_delete_own"
    ON public.notifications FOR DELETE
    USING (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 10. POLICIES FOR AUDIT_LOGS
-- ----------------------------------------------------------------------------
-- A. Only administrators can read audit logs
CREATE POLICY "audit_logs_admin_read_only"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin());

-- Ordinary users have NO direct SELECT, UPDATE, or DELETE access.
-- Insert is performed via SECURITY DEFINER functions.

-- ----------------------------------------------------------------------------
-- 11. POLICIES FOR USER_PREFERENCES
-- ----------------------------------------------------------------------------
CREATE POLICY "user_preferences_read_own"
    ON public.user_preferences FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "user_preferences_insert_own"
    ON public.user_preferences FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_preferences_update_own"
    ON public.user_preferences FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
