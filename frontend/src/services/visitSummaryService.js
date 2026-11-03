import { supabase } from '../lib/supabase.js';

export const visitSummaryService = {
  /**
   * Fetch clinical summary for a specific appointment
   */
  async getAppointmentSummary(appointmentId) {
    const { data, error } = await supabase
      .from('visit_summaries')
      .select('*')
      .eq('appointment_id', appointmentId)
      .maybeSingle();

    if (error) {
      console.error('[visitSummaryService] Error fetching appointment summary:', error);
      throw error;
    }

    return data || null;
  },

  /**
   * Fetch appointment details for composing or reviewing a summary
   */
  async getAppointmentDetailsForSummary(appointmentId) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        doctor_id,
        consultation_reason,
        status,
        created_at,
        profiles:patient_id (
          id,
          full_name,
          phone
        ),
        availability_slots:slot_id (
          start_time,
          end_time
        )
      `)
      .eq('id', appointmentId)
      .maybeSingle();

    if (error) {
      console.error('[visitSummaryService] Error fetching appointment details:', error);
      throw error;
    }

    if (!data) return null;

    const startTime = data.availability_slots?.start_time
      ? new Date(data.availability_slots.start_time)
      : new Date(data.created_at);

    return {
      id: data.id,
      patientId: data.patient_id,
      patientName: data.profiles?.full_name || 'Patient',
      patientPhone: data.profiles?.phone || '',
      doctorId: data.doctor_id,
      date: startTime.toISOString().split('T')[0],
      reason: data.consultation_reason || 'General Consultation',
      status: data.status
    };
  },

  /**
   * Fetch all summaries created by a doctor (both published and drafts)
   */
  async getDoctorSummaries(doctorUserId) {
    const { data: docProfile, error: docErr } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', doctorUserId)
      .maybeSingle();

    if (docErr) throw docErr;
    if (!docProfile) return [];

    const { data, error } = await supabase
      .from('visit_summaries')
      .select(`
        id,
        appointment_id,
        doctor_id,
        patient_id,
        summary,
        diagnosis,
        prescribed_medications,
        follow_up_date,
        is_published,
        published_at,
        created_at,
        profiles:patient_id (
          full_name
        )
      `)
      .eq('doctor_id', docProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[visitSummaryService] Error fetching doctor summaries:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(s => ({
      id: s.id,
      appointmentId: s.appointment_id,
      patientName: s.profiles?.full_name || 'Patient',
      diagnosis: s.diagnosis || 'Clinical Consultation',
      summary: s.summary,
      medications: s.prescribed_medications,
      followUpDate: s.follow_up_date,
      isPublished: s.is_published,
      date: new Date(s.created_at).toISOString().split('T')[0]
    }));
  },

  /**
   * Save or publish consultation summary and prescription
   */
  async saveSummary({
    appointmentId,
    doctorId,
    patientId,
    summary,
    diagnosis,
    medications,
    followUpDate,
    isPublished = true
  }) {
    let resolvedDoctorId = doctorId;
    let resolvedPatientId = patientId;

    // Resolve doctor profile ID if auth user ID was passed
    if (doctorId) {
      const { data: docProfile } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', doctorId)
        .maybeSingle();

      if (docProfile) {
        resolvedDoctorId = docProfile.id;
      }
    }

    if (!resolvedPatientId && appointmentId) {
      const { data: appt } = await supabase
        .from('appointments')
        .select('patient_id, doctor_id')
        .eq('id', appointmentId)
        .maybeSingle();

      if (appt) {
        resolvedPatientId = appt.patient_id;
        if (!resolvedDoctorId) resolvedDoctorId = appt.doctor_id;
      }
    }

    const payload = {
      appointment_id: appointmentId,
      doctor_id: resolvedDoctorId,
      patient_id: resolvedPatientId,
      summary,
      diagnosis,
      prescribed_medications: medications,
      follow_up_date: followUpDate || null,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('visit_summaries')
      .upsert(payload, { onConflict: 'appointment_id' })
      .select()
      .single();

    if (error) {
      console.error('[visitSummaryService] Error saving visit summary:', error);
      throw error;
    }

    if (isPublished && resolvedPatientId) {
      await supabase.from('notifications').insert({
        user_id: resolvedPatientId,
        title: 'Consultation Summary Published',
        message: 'Your physician has published the visit summary and prescription for your consultation.',
        type: 'SUMMARY',
        related_resource_id: appointmentId
      }).then(() => {}).catch(() => {});
    }

    return data;
  }
};

export default visitSummaryService;
