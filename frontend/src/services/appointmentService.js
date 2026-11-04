
import { supabase } from '../lib/supabase';

const isValidUUID = (value) => {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

const EMPTY_UUID = '00000000-0000-0000-0000-000000000000';

export const appointmentService = {

  // Fetch approved and publicly listed doctors
  async getPublicDoctors() {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select(`
        id,
        user_id,
        specialty,
        qualification,
        experience_years,
        consultation_fee,
        verification_status,
        is_public
      `)
      .eq('verification_status', 'APPROVED')
      .eq('is_public', true);

    if (error) throw error;

    if (!data?.length) return [];

    const userIds = data.map(doc => doc.user_id);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profileError) throw profileError;

    const profileMap = new Map(
      (profiles || []).map(profile => [
        profile.id,
        profile.full_name
      ])
    );

    return data.map(doc => ({
      id: doc.id,
      userId: doc.user_id,
      name: profileMap.get(doc.user_id) || 'Dr. Specialist',
      specialty: doc.specialty || 'General Medicine',
      qualification: doc.qualification || '',
      experience: doc.experience_years != null
        ? `${doc.experience_years} yrs exp`
        : 'Not provided',
      experience_years: doc.experience_years || 0,
      consultationFee: doc.consultation_fee || 0
    }));
  },

  // Fetch availability slots for a doctor on a selected date
  async getDoctorSlots(doctorProfileId, dateStr) {
    if (!doctorProfileId || !dateStr) return [];

    if (!isValidUUID(doctorProfileId)) {
      throw new Error(
        'Invalid doctor profile ID. Use doctor_profiles.id, not user.id.'
      );
    }

    const startOfDay = new Date(
      `${dateStr}T00:00:00`
    ).toISOString();

    const endOfDay = new Date(
      `${dateStr}T23:59:59.999`
    ).toISOString();

    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('doctor_profile_id', doctorProfileId)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Get doctor slots error:', error);
      throw error;
    }

    return (data || []).map(slot => ({
      id: slot.id,
      time: new Date(slot.start_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
      status: slot.status || 'Available',
      startTime: slot.start_time,
      endTime: slot.end_time
    }));
  },

  // Patient books an available slot
  async bookAppointment(appointmentData) {
    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser();

    if (authError) throw authError;

    if (!user) {
      throw new Error('Please log in before booking.');
    }

    const slotId = appointmentData.slotId;

    // This must be doctor_profiles.id, not profiles.id.
    const doctorId =
      appointmentData.doctorId ||
      appointmentData.doctor_id;

    if (!slotId || !doctorId) {
      throw new Error('Doctor and appointment slot are required.');
    }

    if (!isValidUUID(doctorId)) {
      throw new Error(
        'Invalid doctor ID. Pass the doctor_profiles.id UUID.'
      );
    }

    const patientId = appointmentData.patient_id || user.id;

    if (!isValidUUID(patientId)) {
      throw new Error('Invalid patient ID. Expected a UUID.');
    }

    // Reserve the slot only if it is still available.
    const { data: reservedSlot, error: slotError } = await supabase
      .from('availability_slots')
      .update({ status: 'Booked' })
      .eq('id', slotId)
      .eq('doctor_profile_id', doctorId)
      .eq('status', 'Available')
      .select('id')
      .maybeSingle();

    if (slotError) throw slotError;

    if (!reservedSlot) {
      throw new Error(
        'This slot is no longer available. Please select another time.'
      );
    }

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          doctor_id: doctorId,

          patient_name:
            appointmentData.patientName ||
            profile?.full_name ||
            user.email,

          doctor_name:
            appointmentData.doctorName ||
            'Assigned Physician',

          appointment_date:
            appointmentData.date ||
            appointmentData.appointment_date,

          appointment_time:
            appointmentData.time ||
            appointmentData.appointment_time,

          reason:
            appointmentData.reason ||
            'General Consultation',

          consultation_type:
            appointmentData.consultationType ||
            'In-Person',

          slot_id: slotId,
          status: 'PENDING_ADMIN'
        })
        .select()
        .single();

      if (error) throw error;

      return data;

    } catch (error) {
      // Restore the slot if appointment insertion fails.
      const { error: restoreError } = await supabase
        .from('availability_slots')
        .update({ status: 'Available' })
        .eq('id', slotId)
        .eq('status', 'Booked');

      if (restoreError) {
        console.error('Could not restore slot:', restoreError);
      }

      throw error;
    }
  },

  // Admin: Fetch appointments
  async getAdminAppointments({
    search = '',
    status = 'ALL'
  } = {}) {
    let query = supabase
      .from('appointments')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    const appointments = data || [];

    const patientIds = [
      ...new Set(
        appointments
          .map(apt => apt.patient_id)
          .filter(Boolean)
      )
    ];

    let profiles = [];

    if (patientIds.length > 0) {
      const { data: profileData, error: profileError } =
        await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', patientIds);

      if (profileError) throw profileError;

      profiles = profileData || [];
    }

    let mapped = appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patient_id,

      patientName:
        apt.patient_name ||
        profiles.find(p => p.id === apt.patient_id)?.full_name ||
        'Patient',

      doctorId: apt.doctor_id,
      doctorName: apt.doctor_name || 'Assigned Physician',

      date: apt.appointment_date,
      time: apt.appointment_time,

      reason: apt.reason,
      consultationType: apt.consultation_type || 'In-Person',

      slotId: apt.slot_id,
      status: apt.status || 'PENDING_ADMIN',
      createdAt: apt.created_at
    }));

    if (search.trim()) {
      const term = search.toLowerCase();

      mapped = mapped.filter(apt =>
        apt.patientName.toLowerCase().includes(term) ||
        apt.doctorName.toLowerCase().includes(term) ||
        (apt.reason || '').toLowerCase().includes(term)
      );
    }

    return mapped;
  },

  // Admin: Fetch pending appointments
  async getPendingAppointments() {
    return this.getAdminAppointments({
      status: 'PENDING_ADMIN'
    });
  },

  // Admin: Approve appointment
  async approveAppointment(appointmentId) {
    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'APPROVED' })
      .eq('id', appointmentId)
      .eq('status', 'PENDING_ADMIN')
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error('This appointment is no longer pending.');
    }

    return data;
  },

  // Admin: Reject appointment and release its slot
  async rejectAppointment(appointmentId) {
    const { data: appointment, error: fetchError } =
      await supabase
        .from('appointments')
        .select('id, slot_id, status')
        .eq('id', appointmentId)
        .maybeSingle();

    if (fetchError) throw fetchError;

    if (!appointment) {
      throw new Error('Appointment not found.');
    }

    if (appointment.status !== 'PENDING_ADMIN') {
      throw new Error('Only pending appointments can be rejected.');
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: 'REJECTED' })
      .eq('id', appointmentId)
      .eq('status', 'PENDING_ADMIN')
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error('The appointment could not be rejected.');
    }

    if (appointment.slot_id) {
      const { error: slotError } = await supabase
        .from('availability_slots')
        .update({ status: 'Available' })
        .eq('id', appointment.slot_id)
        .eq('status', 'Booked');

      if (slotError) {
        console.error('Slot release error:', slotError);
        throw slotError;
      }
    }

    return data;
  },

  // Doctor: Fetch appointments assigned to their doctor profile
  async getDoctorAppointments({
    doctorId,
    search = '',
    status = 'ALL'
  } = {}) {
    if (!doctorId) return [];

    if (!isValidUUID(doctorId)) {
      throw new Error(
        'Invalid doctor ID. Use user.doctorProfile.id, not user.id.'
      );
    }

    let query = supabase
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
      .in('status', [
        'APPROVED',
        'COMPLETED',
        'CANCELLED'
      ])
      .order('appointment_date', { ascending: true });

    if (status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    const appointments = data || [];

    const patientIds = [
      ...new Set(
        appointments
          .map(apt => apt.patient_id)
          .filter(Boolean)
      )
    ];

    let profiles = [];

    if (patientIds.length > 0) {
      const { data: profileData, error: profileError } =
        await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', patientIds);

      if (profileError) throw profileError;

      profiles = profileData || [];
    }

    let mapped = appointments.map(apt => ({
      id: apt.id,

      patientId: apt.patient_id,

      patientName:
        apt.patient_name ||
        profiles.find(p => p.id === apt.patient_id)?.full_name ||
        'Patient',

      doctorId: apt.doctor_id,
      doctorName: apt.doctor_name || 'Assigned Physician',

      date: apt.appointment_date,
      time: apt.appointment_time,

      reason: apt.reason,
      symptoms: apt.reason,
      consultationReason: apt.reason,

      consultationType:
        apt.consultation_type || 'In-Person',

      slotId: apt.slot_id,
      status: apt.status
    }));

    if (search.trim()) {
      const term = search.toLowerCase();

      mapped = mapped.filter(apt =>
        apt.patientName.toLowerCase().includes(term) ||
        (apt.reason || '').toLowerCase().includes(term)
      );
    }

    return mapped;
  },

  // Patient: Fetch their appointments
  async getPatientAppointments(patientId) {
    if (!patientId) return [];

    if (!isValidUUID(patientId)) {
      throw new Error('Invalid patient ID. Expected a UUID.');
    }

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: true });

    if (error) throw error;

    return (data || []).map(apt => ({
      id: apt.id,
      doctor: apt.doctor_name || 'Assigned Physician',
      doctorId: apt.doctor_id,
      specialty: 'General Consultation',
      date: apt.appointment_date,
      time: apt.appointment_time,
      status: apt.status,
      reason: apt.reason
    }));
  },

  // Doctor: Complete or cancel an approved appointment
  async updateAppointmentStatus(appointmentId, newStatus) {
    const safeStatus = newStatus?.toUpperCase();

    if (!['COMPLETED', 'CANCELLED'].includes(safeStatus)) {
      throw new Error('Invalid appointment status.');
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ status: safeStatus })
      .eq('id', appointmentId)
      .eq('status', 'APPROVED')
      .select()
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      throw new Error(
        'Only approved appointments can be completed or cancelled.'
      );
    }

    if (safeStatus === 'CANCELLED' && data.slot_id) {
      const { error: slotError } = await supabase
        .from('availability_slots')
        .update({ status: 'Available' })
        .eq('id', data.slot_id)
        .eq('status', 'Booked');

      if (slotError) {
        console.error('Slot release error:', slotError);
        throw slotError;
      }
    }

    return data;
  }
};

export default appointmentService;
