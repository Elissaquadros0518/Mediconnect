import { supabase } from '../lib/supabase';

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
    const payload = {
      appointment_id: appointmentId,
      doctor_id: doctorId,
      patient_id: patientId,
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

      if (isPublished && patientId) {
        // Send notification to patient
        await supabase.from('notifications').insert({
          user_id: patientId,
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
