import { supabase } from '../lib/supabase';

export const appointmentService = {
  // 1. Fetch public doctors for booking page
  async getPublicDoctors() {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select('*');

    if (error) throw error;

    return (data || []).map(doc => ({
      id: doc.id,
      name: doc.full_name || doc.name || 'Dr. Specialist',
      specialty: doc.specialty || 'General Medicine',
      qualification: doc.qualification || 'MBBS, MD',
      experience: `${doc.experience_years || 5} yrs exp`,
      location: doc.hospital_affiliation || 'Main Hospital Branch',
      rating: doc.rating || 4.8
    }));
  },

  // 2. Fetch doctor availability slots
  async getDoctorSlots(doctorProfileId, dateStr) {
    if (!doctorProfileId) return [];

    const startOfDay = `${dateStr}T00:00:00.000Z`;
    const endOfDay = `${dateStr}T23:59:59.999Z`;

    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('doctor_profile_id', doctorProfileId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time', { ascending: true });

    if (error) throw error;

    return (data || []).map(slot => {
      const startDate = new Date(slot.start_time);
      return {
        id: slot.id,
        time: startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
        status: slot.status || 'Available',
        startTime: slot.start_time,
        endTime: slot.end_time
      };
    });
  },

  // 3. Book a new appointment (saves as PENDING_ADMIN)
  async bookAppointment(appointmentData) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        {
          patient_id: appointmentData.patient_id || (await supabase.auth.getUser()).data.user?.id,
          doctor_id: appointmentData.doctorId || appointmentData.doctor_id,
          doctor_name: appointmentData.doctorName,
          appointment_date: appointmentData.date || appointmentData.appointment_date,
          appointment_time: appointmentData.time || appointmentData.appointment_time,
          reason: appointmentData.reason,
          status: 'PENDING_ADMIN'
        }
      ])
      .select();

    if (error) throw error;
    return data[0];
  },

  // 4. Fetch patient appointments for PatientDashboard.jsx
  async getPatientAppointments(patientId) {
    if (!patientId) return [];

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(apt => ({
      id: apt.id,
      doctor: apt.doctor_name || 'Assigned Physician',
      specialty: apt.specialty || 'General Consultation',
      date: apt.appointment_date,
      time: apt.appointment_time,
      status: apt.status === 'PENDING_ADMIN' ? 'Pending Approval' : apt.status,
      reason: apt.reason
    }));
  }
};