-- ============================================================================
-- Migration: 20261027150100_create_triggers_and_functions.sql
-- Description: Business logic, security triggers, and atomic functions
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. AUTOMATIC UPDATED_AT TIMESTAMP TRIGGER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_doctor_profiles_updated_at
    BEFORE UPDATE ON public.doctor_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_availability_slots_updated_at
    BEFORE UPDATE ON public.availability_slots
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_visit_summaries_updated_at
    BEFORE UPDATE ON public.visit_summaries
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON public.user_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 2. HELPER FUNCTIONS FOR ROLE AND PERMISSION CHECKS (SECURITY DEFINER)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    v_role TEXT;
BEGIN
    SELECT role INTO v_role FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(v_role, 'ANONYMOUS');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_user_role(auth.uid()) = 'ADMIN');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.is_doctor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT public.get_user_role(auth.uid()) = 'DOCTOR');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

CREATE OR REPLACE FUNCTION public.get_my_doctor_id()
RETURNS UUID AS $$
DECLARE
    v_doctor_id UUID;
BEGIN
    SELECT id INTO v_doctor_id FROM public.doctor_profiles WHERE user_id = auth.uid();
    RETURN v_doctor_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth;

-- ----------------------------------------------------------------------------
-- 3. AUDIT LOG HELPER FUNCTION
-- ----------------------------------------------------------------------------
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- ----------------------------------------------------------------------------
-- 4. NEW USER REGISTRATION PROFILE CREATION TRIGGER
-- ----------------------------------------------------------------------------
-- Fulfills requirements:
-- - Automatically create a profile when appropriate during registration
-- - Prevent users from granting themselves administrator privileges
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_phone TEXT;
    v_requested_role TEXT;
    v_assigned_role TEXT;
    v_specialty_id UUID;
    v_license TEXT;
BEGIN
    -- Extract metadata
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_phone := NEW.raw_user_meta_data->>'phone';
    v_requested_role := UPPER(COALESCE(NEW.raw_user_meta_data->>'role', 'PATIENT'));

    -- Security Guard: Ordinary signups CANNOT register as ADMIN
    IF v_requested_role = 'DOCTOR' THEN
        v_assigned_role := 'DOCTOR';
    ELSE
        -- Default all other requests (including attempts to register as ADMIN) to PATIENT
        v_assigned_role := 'PATIENT';
    END IF;

    -- Create profile row
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
    ) ON CONFLICT (id) DO NOTHING;

    -- If registered as DOCTOR, create doctor_profiles record (pending verification)
    IF v_assigned_role = 'DOCTOR' THEN
        v_license := NEW.raw_user_meta_data->>'registration_number';
        IF v_license IS NULL THEN
            v_license := NEW.raw_user_meta_data->>'medical_license';
        END IF;

        -- Check if specialty was passed
        IF NEW.raw_user_meta_data->>'specialty' IS NOT NULL THEN
            SELECT id INTO v_specialty_id FROM public.specialties 
            WHERE LOWER(name) = LOWER(NEW.raw_user_meta_data->>'specialty') LIMIT 1;
        END IF;

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
            COALESCE(NEW.raw_user_meta_data->>'qualification', 'Specialist Physician'),
            v_license,
            COALESCE(NEW.raw_user_meta_data->>'bio', 'Consultant Doctor at MediConnect Hospital.'),
            'PENDING', -- Must be approved by admin
            false      -- Not public until approved
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;

    -- Create default user preferences
    INSERT INTO public.user_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    -- Create security audit log
    PERFORM public.create_audit_log(
        'USER_REGISTERED',
        'AUTH',
        NEW.id::text,
        'SUCCESS',
        jsonb_build_object('role', v_assigned_role, 'email', NEW.email)
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 5. PREVENT PROFILE ROLE SELF-ESCALATION TRIGGER
-- ----------------------------------------------------------------------------
-- Fulfills requirements:
-- - Prevent users from changing their own role
-- - Prevent users from granting themselves administrator privileges
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If updating own profile and caller is not an administrator
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

DROP TRIGGER IF EXISTS trigger_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trigger_prevent_role_escalation
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_escalation();

-- ----------------------------------------------------------------------------
-- 6. PREVENT OVERLAPPING DOCTOR AVAILABILITY SLOTS
-- ----------------------------------------------------------------------------
-- Fulfills requirements:
-- - Prevent overlapping slots for the same doctor
CREATE OR REPLACE FUNCTION public.check_overlapping_slots()
RETURNS TRIGGER AS $$
DECLARE
    v_conflict_count INT;
BEGIN
    -- Only check for non-cancelled slots
    IF NEW.status <> 'CANCELLED' THEN
        SELECT COUNT(*)
        INTO v_conflict_count
        FROM public.availability_slots
        WHERE doctor_id = NEW.doctor_id
          AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
          AND status <> 'CANCELLED'
          AND (
              (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
          );

        IF v_conflict_count > 0 THEN
            RAISE EXCEPTION 'Doctor already has an overlapping availability slot during this timeframe.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_check_slot_overlap ON public.availability_slots;
CREATE TRIGGER trigger_check_slot_overlap
    BEFORE INSERT OR UPDATE ON public.availability_slots
    FOR EACH ROW EXECUTE FUNCTION public.check_overlapping_slots();

-- ----------------------------------------------------------------------------
-- 7. ATOMIC APPOINTMENT BOOKING FUNCTION (RPC)
-- ----------------------------------------------------------------------------
-- Fulfills requirements:
-- - Prevent concurrent requests from booking the same slot
-- - Do not offer past slots for new appointments
-- - Atomic transaction with row locking (SELECT ... FOR UPDATE)
-- - Creates appointment, marks slot BOOKED, generates notifications and audit log
CREATE OR REPLACE FUNCTION public.book_appointment(
    p_slot_id UUID,
    p_consultation_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_slot RECORD;
    v_doctor RECORD;
    v_appointment_id UUID;
    v_doctor_user_id UUID;
    v_patient_name TEXT;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to book an appointment.';
    END IF;

    -- Validate caller profile is ACTIVE
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_caller_id AND account_status = 'ACTIVE') THEN
        RAISE EXCEPTION 'Your account is not active. Please contact hospital administration.';
    END IF;

    -- Fetch patient name
    SELECT full_name INTO v_patient_name FROM public.profiles WHERE id = v_caller_id;

    -- Concurrently lock slot row
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

    -- Fetch doctor details
    SELECT user_id INTO v_doctor_user_id
    FROM public.doctor_profiles
    WHERE id = v_slot.doctor_id;

    -- Update slot to BOOKED
    UPDATE public.availability_slots
    SET status = 'BOOKED', updated_at = timezone('utc', now())
    WHERE id = p_slot_id;

    -- Insert appointment record
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

    -- Create persistent notification for patient
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        related_resource_id
    ) VALUES (
        v_caller_id,
        'Appointment Confirmed',
        format('Your consultation is scheduled for %s.', to_char(v_slot.start_time, 'YYYY-MM-DD HH24:MI UTC')),
        'APPOINTMENT',
        v_appointment_id::text
    );

    -- Create persistent notification for doctor
    IF v_doctor_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            type,
            related_resource_id
        ) VALUES (
            v_doctor_user_id,
            'New Patient Consultation Scheduled',
            format('Patient %s has booked a consultation for %s.', v_patient_name, to_char(v_slot.start_time, 'YYYY-MM-DD HH24:MI UTC')),
            'APPOINTMENT',
            v_appointment_id::text
        );
    END IF;

    -- Audit log
    PERFORM public.create_audit_log(
        'APPOINTMENT_BOOKED',
        'APPOINTMENT',
        v_appointment_id::text,
        'SUCCESS',
        jsonb_build_object(
            'slot_id', p_slot_id,
            'doctor_id', v_slot.doctor_id,
            'patient_id', v_caller_id
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'status', 'CONFIRMED',
        'slot_id', p_slot_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- ----------------------------------------------------------------------------
-- 8. ATOMIC APPOINTMENT CANCELLATION FUNCTION (RPC)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cancel_appointment(
    p_appointment_id UUID,
    p_cancellation_reason TEXT DEFAULT 'Cancelled by user'
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_appt RECORD;
    v_slot RECORD;
    v_doctor_user_id UUID;
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

    -- Verify authorization: patient, assigned doctor, or admin
    IF v_appt.patient_id <> v_caller_id AND v_appt.doctor_user_id <> v_caller_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to cancel this appointment.';
    END IF;

    IF v_appt.status IN ('CANCELLED', 'COMPLETED') THEN
        RAISE EXCEPTION 'Appointment is already % and cannot be cancelled.', v_appt.status;
    END IF;

    -- Update appointment
    UPDATE public.appointments
    SET status = 'CANCELLED',
        cancellation_reason = p_cancellation_reason,
        cancelled_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_appointment_id;

    -- Release slot if it is in the future
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

    -- Notifications
    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (
        v_appt.patient_id,
        'Appointment Cancelled',
        format('Appointment #%s has been cancelled: %s', substring(p_appointment_id::text, 1, 8), p_cancellation_reason),
        'APPOINTMENT',
        p_appointment_id::text
    );

    IF v_appt.doctor_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
        VALUES (
            v_appt.doctor_user_id,
            'Consultation Cancelled',
            format('Scheduled consultation #%s was cancelled.', substring(p_appointment_id::text, 1, 8)),
            'APPOINTMENT',
            p_appointment_id::text
        );
    END IF;

    -- Audit log
    PERFORM public.create_audit_log(
        'APPOINTMENT_CANCELLED',
        'APPOINTMENT',
        p_appointment_id::text,
        'SUCCESS',
        jsonb_build_object('reason', p_cancellation_reason)
    );

    RETURN jsonb_build_object('success', true, 'appointment_id', p_appointment_id, 'status', 'CANCELLED');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
