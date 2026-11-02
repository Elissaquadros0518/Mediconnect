-- ============================================================================
-- STAGE 3: SECURITY DEFINER FUNCTIONS & TRIGGERS
-- ============================================================================

BEGIN;

-- 1. Automatic updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON public.profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_doctor_profiles_updated_at ON public.doctor_profiles;
CREATE TRIGGER trigger_doctor_profiles_updated_at BEFORE UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_availability_slots_updated_at ON public.availability_slots;
CREATE TRIGGER trigger_availability_slots_updated_at BEFORE UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_appointments_updated_at ON public.appointments;
CREATE TRIGGER trigger_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_visit_summaries_updated_at ON public.visit_summaries;
CREATE TRIGGER trigger_visit_summaries_updated_at BEFORE UPDATE ON public.visit_summaries FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Role & Helper Functions
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_role, 'ANONYMOUS');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_user_role(auth.uid()) = 'ADMIN');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_user_role(auth.uid()) = 'DOCTOR');
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

-- 3. Audit Logging Procedure
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

-- 4. New User Registration Trigger
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
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'user'), '@', 1));
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_requested_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT'));

    IF v_requested_role = 'DOCTOR' THEN
        v_assigned_role := 'DOCTOR';
    ELSE
        -- Prevent public signups from self-assigning ADMIN
        v_assigned_role := 'PATIENT';
    END IF;

    INSERT INTO public.profiles (
        id,
        full_name,
        phone,
        role,
        account_status
    ) VALUES (
        NEW.id,
        v_full_name,
        v_phone,
        v_assigned_role,
        'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        role = CASE 
            WHEN public.profiles.role = 'ADMIN' THEN 'ADMIN'
            WHEN v_assigned_role = 'DOCTOR' THEN 'DOCTOR'
            ELSE public.profiles.role
        END;

    IF v_assigned_role = 'DOCTOR' THEN
        v_license := COALESCE(NEW.raw_user_meta_data->>'registration_number', NEW.raw_user_meta_data->>'medical_license');
        v_qualification := COALESCE(NEW.raw_user_meta_data->>'qualification', 'Specialist Physician');

        IF NEW.raw_user_meta_data->>'specialty' IS NOT NULL THEN
            SELECT id INTO v_specialty_id FROM public.specialties 
            WHERE LOWER(name) = LOWER(NEW.raw_user_meta_data->>'specialty') LIMIT 1;
        END IF;

        -- Strictly PENDING verification and NOT public by default
        INSERT INTO public.doctor_profiles (
            user_id,
            specialty_id,
            qualification,
            registration_number,
            biography,
            verification_status,
            is_public
        ) VALUES (
            NEW.id,
            v_specialty_id,
            v_qualification,
            v_license,
            COALESCE(NEW.raw_user_meta_data->>'bio', 'Consultant Doctor at MediConnect.'),
            'PENDING',
            false
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    PERFORM public.create_audit_log(
        'USER_REGISTERED',
        'AUTH',
        NEW.id::text,
        'SUCCESS',
        jsonb_build_object('role', v_assigned_role, 'email', NEW.email)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Prevent Role Self-Escalation
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.uid() = OLD.id AND NOT public.is_admin() THEN
        IF NEW.role <> OLD.role THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own security role.';
        END IF;
        IF NEW.account_status <> OLD.account_status THEN
            RAISE EXCEPTION 'Unauthorized: Users cannot modify their own account status.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- 6. Prevent Doctor Self-Verification & Self-Publishing (Dual INSERT/UPDATE Guard)
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
CREATE TRIGGER trigger_prevent_doctor_self_verification
    BEFORE INSERT OR UPDATE ON public.doctor_profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_doctor_self_verification();

-- 7. Prevent Overlapping Availability Slots
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
          AND ((NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time));

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'Doctor already has an overlapping availability slot during this timeframe.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trigger_check_slot_overlap ON public.availability_slots;
CREATE TRIGGER trigger_check_slot_overlap
    BEFORE INSERT OR UPDATE ON public.availability_slots
    FOR EACH ROW EXECUTE FUNCTION public.check_overlapping_slots();

-- 8. Atomic Appointment Booking RPC
CREATE OR REPLACE FUNCTION public.book_appointment(
    p_slot_id UUID,
    p_consultation_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_slot RECORD;
    v_appointment_id UUID;
    v_doctor_user_id UUID;
    v_patient_name TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to book an appointment.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller_id AND account_status = 'ACTIVE') THEN
        RAISE EXCEPTION 'Your account is not active. Please contact hospital administration.';
    END IF;

    SELECT full_name INTO v_patient_name FROM public.profiles WHERE id = v_caller_id;

    SELECT * INTO v_slot
    FROM public.availability_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Availability slot not found.';
    END IF;

    IF v_slot.status <> 'AVAILABLE' THEN
        RAISE EXCEPTION 'This slot has already been reserved or is unavailable.';
    END IF;

    IF v_slot.start_time <= timezone('utc', now()) THEN
        RAISE EXCEPTION 'Cannot book an appointment slot that is in the past.';
    END IF;

    -- Security Guard: Reject booking if doctor is not approved and public
    IF NOT EXISTS (
        SELECT 1 FROM public.doctor_profiles 
        WHERE id = v_slot.doctor_id 
          AND verification_status = 'APPROVED' 
          AND is_public = true
    ) THEN
        RAISE EXCEPTION 'Cannot book appointments with unapproved or private medical practitioners.';
    END IF;

    SELECT user_id INTO v_doctor_user_id
    FROM public.doctor_profiles
    WHERE id = v_slot.doctor_id;

    UPDATE public.availability_slots
    SET status = 'BOOKED', updated_at = timezone('utc', now())
    WHERE id = p_slot_id;

    INSERT INTO public.appointments (
        patient_id,
        doctor_id,
        slot_id,
        consultation_reason,
        status
    ) VALUES (
        v_caller_id,
        v_slot.doctor_id,
        p_slot_id,
        p_consultation_reason,
        'CONFIRMED'
    ) RETURNING id INTO v_appointment_id;

    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (
        v_caller_id,
        'Appointment Confirmed',
        format('Your consultation is scheduled for %s.', to_char(v_slot.start_time, 'YYYY-MM-DD HH24:MI UTC')),
        'APPOINTMENT',
        v_appointment_id::text
    );

    IF v_doctor_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
        VALUES (
            v_doctor_user_id,
            'New Patient Consultation Scheduled',
            format('Patient %s has booked a consultation for %s.', v_patient_name, to_char(v_slot.start_time, 'YYYY-MM-DD HH24:MI UTC')),
            'APPOINTMENT',
            v_appointment_id::text
        );
    END IF;

    PERFORM public.create_audit_log(
        'APPOINTMENT_BOOKED',
        'APPOINTMENT',
        v_appointment_id::text,
        'SUCCESS',
        jsonb_build_object('slot_id', p_slot_id, 'doctor_id', v_slot.doctor_id, 'patient_id', v_caller_id)
    );

    RETURN jsonb_build_object('success', true, 'appointment_id', v_appointment_id, 'status', 'CONFIRMED', 'slot_id', p_slot_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- 9. Cancel, Reject, Complete RPC Functions
CREATE OR REPLACE FUNCTION public.cancel_appointment(
    p_appointment_id UUID,
    p_cancellation_reason TEXT DEFAULT 'Cancelled by user'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_appt RECORD;
    v_slot RECORD;
BEGIN
    v_caller_id := auth.uid();
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

    IF v_appt.status IN ('CANCELLED', 'COMPLETED') THEN
        RAISE EXCEPTION 'Appointment is already % and cannot be cancelled.', v_appt.status;
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

    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (v_appt.patient_id, 'Appointment Cancelled', format('Appointment #%s was cancelled.', substring(p_appointment_id::text, 1, 8)), 'APPOINTMENT', p_appointment_id::text);

    IF v_appt.doctor_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
        VALUES (v_appt.doctor_user_id, 'Consultation Cancelled', format('Consultation #%s was cancelled.', substring(p_appointment_id::text, 1, 8)), 'APPOINTMENT', p_appointment_id::text);
    END IF;

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id, 'status', 'CANCELLED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.reject_appointment(
    p_appointment_id UUID,
    p_rejection_reason TEXT DEFAULT 'Declined by physician'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_appt RECORD;
    v_slot RECORD;
BEGIN
    v_caller_id := auth.uid();
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
        RAISE EXCEPTION 'Unauthorized to decline this appointment.';
    END IF;

    IF v_appt.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Only pending appointments can be declined.';
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
    VALUES (v_appt.patient_id, 'Appointment Request Declined', format('Your consultation request was declined: %s', p_rejection_reason), 'APPOINTMENT', p_appointment_id::text);

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id, 'status', 'REJECTED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

CREATE OR REPLACE FUNCTION public.complete_appointment(
    p_appointment_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_appt RECORD;
BEGIN
    v_caller_id := auth.uid();
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
    VALUES (v_appt.patient_id, 'Consultation Completed', 'Your medical consultation has concluded. A visit summary is available in your records.', 'APPOINTMENT', p_appointment_id::text);

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id, 'status', 'COMPLETED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

-- Post-Stage 3 Verification Query
SELECT routine_name, routine_type, security_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_user_role', 'is_admin', 'is_doctor', 'get_my_doctor_id', 'book_appointment', 'cancel_appointment', 'reject_appointment', 'complete_appointment')
ORDER BY routine_name;

COMMIT;
