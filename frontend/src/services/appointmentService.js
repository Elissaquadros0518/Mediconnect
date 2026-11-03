import { supabase } from '../lib/supabase.js';

export const appointmentService = {
  /**
   * Book an appointment using atomic database function or direct transactional insert
   */
  async bookAppointment({ slotId, doctorId, reason = 'General Consultation' }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Authentication required to book an appointment.');

    // 1. Attempt atomic database function RPC first
    try {
      const { data, error } = await supabase.rpc('book_appointment', {
        p_slot_id: slotId,
        p_consultation_reason: reason
      });

      if (!error && data?.success) {
        return data;
      }
      if (error && !error.message?.includes('function') && !error.message?.includes('not found')) {
        throw new Error(error.message || 'Failed to book slot.');
      }
    } catch (rpcErr) {
      if (!rpcErr.message?.includes('function') && !rpcErr.message?.includes('not found')) {
        throw rpcErr;
      }
    }

    // 2. Direct atomic operation fallback: check slot availability, book slot, insert appointment
    const { data: slot, error: slotCheckErr } = await supabase
      .from('availability_slots')
      .select('id, status, doctor_id, start_time')
      .eq('id', slotId)
      .single();

    if (slotCheckErr || !slot) {
      throw new Error('Selected appointment slot was not found.');
    }

    if (slot.status !== 'AVAILABLE') {
      throw new Error('This appointment slot has already been booked. Please choose another time.');
    }

    const targetDoctorId = doctorId || slot.doctor_id;

    // Mark slot booked
    const { error: slotUpdateErr } = await supabase
      .from('availability_slots')
      .update({ status: 'BOOKED', updated_at: new Date().toISOString() })
      .eq('id', slotId)
      .eq('status', 'AVAILABLE');

    if (slotUpdateErr) {
      throw new Error('Could not reserve slot. It may have just been booked by another patient.');
    }

    // Create appointment
    const { data: appt, error: apptErr } = await supabase
      .from('appointments')
      .insert({
        patient_id: user.id,
        doctor_id: targetDoctorId,
        slot_id: slotId,
        consultation_reason: reason,
        status: 'CONFIRMED'
      })
      .select()
      .single();

    if (apptErr) {
      // Revert slot if appointment creation failed
      await supabase
        .from('availability_slots')
        .update({ status: 'AVAILABLE' })
        .eq('id', slotId);
      throw new Error(`Booking failed: ${apptErr.message}`);
    }

    // Create notification for patient
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Appointment Booked Successfully',
      message: `Your appointment has been confirmed for ${new Date(slot.start_time).toLocaleString()}.`,
      type: 'APPOINTMENT',
      related_resource_id: appt.id
    }).then(() => {}).catch(() => {});

    return { success: true, appointment_id: appt.id, status: 'CONFIRMED' };
  },

  /**
   * Cancel an appointment
   */
  async cancelAppointment(appointmentId, reason = 'Cancelled by patient') {
    // 1. Try atomic database RPC
    try {
      const { data, error } = await supabase.rpc('cancel_appointment', {
        p_appointment_id: appointmentId,
        p_cancellation_reason: reason
      });

      if (!error && data?.success) {
        return data;
      }
    } catch (rpcErr) {
      console.warn('[appointmentService] RPC cancel notice:', rpcErr.message);
    }

    // 2. Direct cancellation update
    const { data: appt, error: fetchErr } = await supabase
      .from('appointments')
      .select('id, slot_id, patient_id, doctor_id')
      .eq('id', appointmentId)
      .single();

    if (fetchErr || !appt) {
      throw new Error('Appointment not found.');
    }

    const { error: updateErr } = await supabase
      .from('appointments')
      .update({
        status: 'CANCELLED',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId);

    if (updateErr) {
      throw new Error(`Cancellation failed: ${updateErr.message}`);
    }

    // Release slot if future
    if (appt.slot_id) {
      await supabase
        .from('availability_slots')
        .update({ status: 'AVAILABLE', updated_at: new Date().toISOString() })
        .eq('id', appt.slot_id)
        .gt('start_time', new Date().toISOString())
        .then(() => {}).catch(() => {});
    }

    return { success: true, appointment_id: appointmentId, status: 'CANCELLED' };
  },

  /**
   * Get appointments for a patient
   */
  async getPatientAppointments(patientId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        consultation_reason,
        status,
        cancellation_reason,
        created_at,
        doctor_profiles:doctor_id (
          id,
          qualification,
          specialties ( name ),
          profiles:user_id ( full_name )
        ),
        availability_slots:slot_id (
          start_time,
          end_time
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[appointmentService] Error fetching patient appointments:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(apt => {
      const startTime = apt.availability_slots?.start_time
        ? new Date(apt.availability_slots.start_time)
        : new Date(apt.created_at);
      const endTime = apt.availability_slots?.end_time
        ? new Date(apt.availability_slots.end_time)
        : new Date(startTime.getTime() + 30 * 60000);

      return {
        id: apt.id,
        doctor: apt.doctor_profiles?.profiles?.full_name || 'Specialist Physician',
        specialty: apt.doctor_profiles?.specialties?.name || 'General Medicine',
        date: startTime.toISOString().split('T')[0],
        time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTimeStr: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: apt.status,
        reason: apt.consultation_reason || 'General Consultation',
        cancellationReason: apt.cancellation_reason
      };
    });
  },

  /**
   * Get appointments for a doctor with full joined relations
   */
  async getDoctorAppointments(doctorUserId, { status = 'ALL', date = null } = {}) {
    // 1. Resolve doctor profile id
    const { data: docProfile, error: docErr } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', doctorUserId)
      .maybeSingle();

    if (docErr) throw docErr;
    if (!docProfile) return [];

    let query = supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        doctor_id,
        slot_id,
        consultation_reason,
        status,
        cancellation_reason,
        created_at,
        cancelled_at,
        completed_at,
        profiles:patient_id (
          id,
          full_name,
          phone,
          avatar_path
        ),
        availability_slots:slot_id (
          id,
          start_time,
          end_time,
          status
        )
      `)
      .eq('doctor_id', docProfile.id)
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data, error } = await query;
    if (error) {
      console.error('[appointmentService] Error fetching doctor appointments:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(apt => {
      const slotStart = apt.availability_slots?.start_time;
      const slotEnd = apt.availability_slots?.end_time;
      const startTime = slotStart ? new Date(slotStart) : new Date(apt.created_at);
      const endTime = slotEnd ? new Date(slotEnd) : new Date(startTime.getTime() + 30 * 60000);

      return {
        id: apt.id,
        patientId: apt.patient_id,
        patientName: apt.profiles?.full_name || 'Patient',
        patientPhone: apt.profiles?.phone || 'Not provided',
        patientAvatar: apt.profiles?.avatar_path,
        specialty: 'Specialist Consultation',
        date: startTime.toISOString().split('T')[0],
        time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTimeStr: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rawStartTime: slotStart,
        rawEndTime: slotEnd,
        status: apt.status,
        symptoms: apt.consultation_reason || 'Routine consultation',
        consultationReason: apt.consultation_reason || 'Routine consultation',
        cancellationReason: apt.cancellation_reason,
        slotId: apt.slot_id,
        createdAt: apt.created_at,
        completedAt: apt.completed_at,
        cancelledAt: apt.cancelled_at
      };
    });
  },

  /**
   * Calculate doctor dashboard summary metrics and analytics
   */
  async getDoctorMetrics(doctorUserId) {
    const appointments = await this.getDoctorAppointments(doctorUserId);
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    const todayAppointments = appointments.filter(a => a.date === todayStr);
    const pendingRequests = appointments.filter(a => a.status?.toUpperCase() === 'PENDING');
    const upcomingAppointments = appointments.filter(a => {
      const isConfirmed = a.status?.toUpperCase() === 'CONFIRMED';
      const isFuture = a.date >= todayStr;
      return isConfirmed && isFuture;
    });
    const completedConsultations = appointments.filter(a => a.status?.toUpperCase() === 'COMPLETED');

    const patientsSeenSet = new Set(completedConsultations.map(a => a.patientId).filter(Boolean));
    const totalPatientsSeen = patientsSeenSet.size;

    let availableSlotsCount = 0;
    try {
      const { data: docProfile } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', doctorUserId)
        .maybeSingle();

      if (docProfile) {
        const { count, error } = await supabase
          .from('availability_slots')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', docProfile.id)
          .eq('status', 'AVAILABLE')
          .gt('start_time', now.toISOString());

        if (!error && typeof count === 'number') {
          availableSlotsCount = count;
        }
      }
    } catch (slotErr) {
      console.warn('Slot count check:', slotErr.message);
    }

    const statusDistribution = [
      { name: 'Confirmed', count: appointments.filter(a => a.status?.toUpperCase() === 'CONFIRMED').length, color: '#0d9488' },
      { name: 'Pending', count: pendingRequests.length, color: '#f59e0b' },
      { name: 'Completed', count: completedConsultations.length, color: '#0284c7' },
      { name: 'Cancelled', count: appointments.filter(a => a.status?.toUpperCase() === 'CANCELLED' || a.status?.toUpperCase() === 'REJECTED').length, color: '#ef4444' }
    ];

    return {
      todayCount: todayAppointments.length,
      pendingCount: pendingRequests.length,
      upcomingCount: upcomingAppointments.length,
      completedCount: completedConsultations.length,
      availableSlotsCount,
      totalPatientsSeen,
      todayAppointments,
      pendingRequests,
      upcomingAppointments,
      statusDistribution
    };
  },

  /**
   * Confirm a pending consultation
   */
  async confirmAppointment(appointmentId) {
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'CONFIRMED',
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select('id, patient_id, status')
      .single();

    if (error) {
      console.error('[appointmentService] Error confirming appointment:', error);
      throw error;
    }

    if (data?.patient_id) {
      await supabase.from('notifications').insert({
        user_id: data.patient_id,
        title: 'Appointment Confirmed by Physician',
        message: 'Your physician has confirmed your appointment. Please arrive 10 minutes prior.',
        type: 'APPOINTMENT',
        related_resource_id: appointmentId
      }).then(() => {}).catch(() => {});
    }

    return { success: true, appointment_id: appointmentId, status: 'CONFIRMED' };
  },

  /**
   * Reject a pending consultation with recorded reason
   */
  async rejectAppointment(appointmentId, reason = 'Declined by physician') {
    // 1. Try atomic database RPC
    try {
      const { data, error } = await supabase.rpc('reject_appointment', {
        p_appointment_id: appointmentId,
        p_rejection_reason: reason
      });

      if (!error && data?.success) {
        return data;
      }
    } catch (rpcErr) {
      console.warn('[appointmentService] RPC reject_appointment notice:', rpcErr.message);
    }

    // 2. Direct update fallback
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'REJECTED',
        cancellation_reason: reason,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select('id, slot_id, patient_id')
      .single();

    if (error) {
      console.error('[appointmentService] Error rejecting appointment:', error);
      throw error;
    }

    // Release slot if future
    if (data?.slot_id) {
      await supabase
        .from('availability_slots')
        .update({ status: 'AVAILABLE', updated_at: new Date().toISOString() })
        .eq('id', data.slot_id)
        .gt('start_time', new Date().toISOString())
        .then(() => {}).catch(() => {});
    }

    // Notify patient
    if (data?.patient_id) {
      await supabase.from('notifications').insert({
        user_id: data.patient_id,
        title: 'Appointment Request Declined',
        message: `Your appointment request was declined: ${reason}`,
        type: 'APPOINTMENT',
        related_resource_id: appointmentId
      }).then(() => {}).catch(() => {});
    }

    return { success: true, appointment_id: appointmentId, status: 'REJECTED' };
  },

  /**
   * Mark consultation completed
   */
  async completeAppointment(appointmentId) {
    // 1. Try atomic database RPC
    try {
      const { data, error } = await supabase.rpc('complete_appointment', {
        p_appointment_id: appointmentId
      });

      if (!error && data?.success) {
        return data;
      }
    } catch (rpcErr) {
      console.warn('[appointmentService] RPC complete_appointment notice:', rpcErr.message);
    }

    // 2. Direct update fallback
    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: 'COMPLETED',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select('id, patient_id')
      .single();

    if (error) {
      console.error('[appointmentService] Error completing appointment:', error);
      throw error;
    }

    if (data?.patient_id) {
      await supabase.from('notifications').insert({
        user_id: data.patient_id,
        title: 'Consultation Completed',
        message: 'Your medical consultation has completed. A visit summary will be available in your records.',
        type: 'APPOINTMENT',
        related_resource_id: appointmentId
      }).then(() => {}).catch(() => {});
    }

    return { success: true, appointment_id: appointmentId, status: 'COMPLETED' };
  },

  /**
   * Update appointment status
   */
  async updateAppointmentStatus(appointmentId, newStatus) {
    const statusUpper = newStatus.toUpperCase();
    if (statusUpper === 'CONFIRMED') {
      return await this.confirmAppointment(appointmentId);
    }
    if (statusUpper === 'REJECTED') {
      return await this.rejectAppointment(appointmentId);
    }
    if (statusUpper === 'COMPLETED') {
      return await this.completeAppointment(appointmentId);
    }
    if (statusUpper === 'CANCELLED') {
      return await this.cancelAppointment(appointmentId);
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({
        status: statusUpper,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single();

    if (error) {
      console.error('[appointmentService] Error updating appointment status:', error);
      throw error;
    }

    return data;
  },

  /**
   * Fetch all appointments across the hospital for admin supervision
   */
  async getAllAppointmentsAdmin({ search = '', status = 'ALL' } = {}) {
    let query = supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        doctor_id,
        status,
        consultation_reason,
        created_at,
        profiles:patient_id ( full_name, phone ),
        doctor_profiles:doctor_id (
          id,
          specialties ( name ),
          profiles:user_id ( full_name )
        ),
        availability_slots:slot_id ( start_time )
      `)
      .order('created_at', { ascending: false });

    if (status !== 'ALL') {
      query = query.eq('status', status.toUpperCase());
    }

    const { data, error } = await query;
    if (error) {
      console.error('[appointmentService] Error fetching admin appointments:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    let results = data.map(apt => {
      const startTime = apt.availability_slots?.start_time
        ? new Date(apt.availability_slots.start_time)
        : new Date(apt.created_at);
      return {
        id: apt.id,
        patientName: apt.profiles?.full_name || 'Patient',
        doctorName: apt.doctor_profiles?.profiles?.full_name || 'Specialist Physician',
        specialty: apt.doctor_profiles?.specialties?.name || 'General Medicine',
        date: startTime.toISOString().split('T')[0],
        time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reason: apt.consultation_reason || 'General Consultation',
        status: apt.status
      };
    });

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(a =>
        a.patientName.toLowerCase().includes(s) ||
        a.doctorName.toLowerCase().includes(s) ||
        a.reason.toLowerCase().includes(s)
      );
    }

    return results;
  }
};

export default appointmentService;
