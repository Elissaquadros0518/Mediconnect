-- ============================================================================
-- Migration: 20261027150400_doctor_operations.sql
-- Description: Atomic Doctor Appointment Operations (Reject, Complete)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ATOMIC APPOINTMENT REJECTION FUNCTION (RPC)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reject_appointment(
    p_appointment_id UUID,
    p_rejection_reason TEXT DEFAULT 'Declined by physician'
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

    -- Lock appointment row
    SELECT a.*, d.user_id AS doctor_user_id
    INTO v_appt
    FROM public.appointments a
    JOIN public.doctor_profiles d ON d.id = a.doctor_id
    WHERE a.id = p_appointment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Appointment not found.';
    END IF;

    -- Verify caller is assigned doctor or admin
    IF v_appt.doctor_user_id <> v_caller_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to reject this appointment.';
    END IF;

    IF v_appt.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Only pending appointments can be rejected. Current status is %.', v_appt.status;
    END IF;

    -- Update appointment status to REJECTED
    UPDATE public.appointments
    SET status = 'REJECTED',
        cancellation_reason = p_rejection_reason,
        cancelled_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_appointment_id;

    -- Release slot back to AVAILABLE if slot is in the future
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

    -- Notify patient
    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (
        v_appt.patient_id,
        'Appointment Request Declined',
        format('Your consultation request was declined: %s', p_rejection_reason),
        'APPOINTMENT',
        p_appointment_id::text
    );

    -- Security audit log
    PERFORM public.create_audit_log(
        'APPOINTMENT_REJECTED',
        'APPOINTMENT',
        p_appointment_id::text,
        'SUCCESS',
        jsonb_build_object('reason', p_rejection_reason)
    );

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'status', 'REJECTED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- ----------------------------------------------------------------------------
-- 2. ATOMIC APPOINTMENT COMPLETION FUNCTION (RPC)
-- ----------------------------------------------------------------------------
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

    -- Verify caller is assigned doctor or admin
    IF v_appt.doctor_user_id <> v_caller_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to complete this consultation.';
    END IF;

    IF v_appt.status <> 'CONFIRMED' THEN
        RAISE EXCEPTION 'Only confirmed appointments can be marked completed. Current status is %.', v_appt.status;
    END IF;

    -- Update appointment status to COMPLETED
    UPDATE public.appointments
    SET status = 'COMPLETED',
        completed_at = timezone('utc', now()),
        updated_at = timezone('utc', now())
    WHERE id = p_appointment_id;

    -- Notify patient
    INSERT INTO public.notifications (user_id, title, message, type, related_resource_id)
    VALUES (
        v_appt.patient_id,
        'Consultation Completed',
        'Your medical consultation has concluded. A visit summary will be available in your medical records.',
        'APPOINTMENT',
        p_appointment_id::text
    );

    -- Security audit log
    PERFORM public.create_audit_log(
        'APPOINTMENT_COMPLETED',
        'APPOINTMENT',
        p_appointment_id::text,
        'SUCCESS',
        jsonb_build_object('completed_at', timezone('utc', now()))
    );

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', p_appointment_id,
        'status', 'COMPLETED'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;
