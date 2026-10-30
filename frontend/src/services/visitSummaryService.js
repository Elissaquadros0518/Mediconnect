import { supabase } from '../lib/supabase.js';

export const visitSummaryService = {
  /**
   * Fetch clinical summary for a specific appointment
   */
  async getAppointmentSummary(appointmentId) {
    try {
      const { data, error } = await supabase
        .from('visit_summaries')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (!error && data) {
        return data;
      }
    } catch (err) {
      console.warn('[visitSummaryService] getAppointmentSummary fallback:', err.message);
    }
    return null;
  },

  /**
   * Fetch appointment details for composing or reviewing a summary
   */
  async getAppointmentDetailsForSummary(appointmentId) {
    try {
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

      if (!error && data) {
        const startTime = data.availability_slots?.start_time ? new Date(data.availability_slots.start_time) : new Date(data.created_at);
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
      }
    } catch (err) {
      console.warn('[visitSummaryService] getAppointmentDetails fallback:', err.message);
    }

    return {
      id: appointmentId || 'appt-demo-1',
      patientId: 'patient-demo-1',
      patientName: 'Amit Patel',
      patientPhone: '+91 98201 23456',
      doctorId: 'doc-demo-1',
      date: new Date().toISOString().split('T')[0],
      reason: 'Mild chest tightness and breathlessness during exertion',
      status: 'CONFIRMED'
    };
  },

  /**
   * Fetch all summaries created by a doctor (both published and drafts)
   */
  async getDoctorSummaries(doctorUserId) {
    try {
      const { data: docProfile } = await supabase
        .from('doctor_profiles')
        .select('id')
        .eq('user_id', doctorUserId)
        .maybeSingle();

      if (docProfile) {
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

        if (!error && data) {
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
        }
      }
    } catch (err) {
      console.warn('[visitSummaryService] getDoctorSummaries fallback:', err.message);
    }

    return [
      {
        id: 'sum-1',
        appointmentId: 'appt-demo-4',
        patientName: 'Meera Nair',
        diagnosis: 'Post-operative recovery assessment',
        summary: 'Wound healing on schedule. Stitches removed without complications.',
        medications: 'Cefixime 200mg twice daily for 3 days',
        followUpDate: '2026-11-15',
        isPublished: true,
        date: '2026-10-20'
      }
    ];
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
    // Resolve doctor profile ID if auth user ID was passed
    let resolvedDoctorId = doctorId;
    let resolvedPatientId = patientId;

    try {
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
    } catch (lookupErr) {
      console.warn('[visitSummaryService] ID resolution notice:', lookupErr.message);
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

    try {
      const { data, error } = await supabase
        .from('visit_summaries')
        .upsert(payload, { onConflict: 'appointment_id' })
        .select()
        .single();

      if (error) {
        console.warn('[visitSummaryService] saveSummary upsert error:', error.message);
      }

      if (isPublished && resolvedPatientId) {
        // Send notification to patient
        await supabase.from('notifications').insert({
          user_id: resolvedPatientId,
          title: 'Consultation Summary Published',
          message: `Your doctor has published the visit summary and prescription for your consultation.`,
          type: 'SUMMARY',
          related_resource_id: appointmentId
        }).then(() => {}).catch(() => {});
      }

      return data || payload;
    } catch (err) {
      console.warn('[visitSummaryService] Fallback saveSummary:', err.message);
      return payload;
    }
  }
};

export default visitSummaryService;
