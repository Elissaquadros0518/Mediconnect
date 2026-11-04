
import { supabase } from '../lib/supabase';

// Validate UUIDs before sending them to UUID-based database columns.
const isValidUUID = (value) => {
  return typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
};

export const doctorService = {

  // Fetch approved and publicly visible doctors.
  async getPublicDoctors() {
    const { data: doctors, error: doctorError } = await supabase
      .from('doctor_profiles')
      .select(`
        id,
        user_id,
        specialty,
        qualification,
        experience_years,
        consultation_fee,
        biography,
        verification_status,
        is_public
      `)
      .eq('verification_status', 'APPROVED')
      .eq('is_public', true);

    if (doctorError) {
      console.error('Doctor profiles error:', doctorError);
      throw doctorError;
    }

    if (!doctors?.length) {
      return [];
    }

    const userIds = doctors.map(doc => doc.user_id);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profileError) {
      console.error('Doctor names error:', profileError);
      throw profileError;
    }

    const profileMap = new Map(
      (profiles || []).map(profile => [
        profile.id,
        profile.full_name
      ])
    );

    return doctors.map(doc => ({
      id: doc.id, // doctor_profiles.id (UUID)
      user_id: doc.user_id, // profiles.id (UUID)
      name: profileMap.get(doc.user_id) || 'Registered Doctor',
      specialty: doc.specialty || 'General',
      qualification: doc.qualification || 'Not provided',
      experience: doc.experience_years != null
        ? `${doc.experience_years} years`
        : 'Not provided',
      location: 'Hospital Branch',
      rating: null,
      consultation_fee: doc.consultation_fee,
      biography: doc.biography || ''
    }));
  },

  // Fetch slots for a particular doctor and date.
  async getDoctorSlots(doctorProfileId, dateStr) {
    if (!doctorProfileId || !dateStr) {
      return [];
    }

    if (!isValidUUID(doctorProfileId)) {
      throw new Error(
        'Invalid doctor profile ID. Expected doctor_profiles.id (UUID), not the authentication user ID.'
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
      console.error('Availability slots error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      throw error;
    }

    return (data || []).map(slot => {
      const startDate = new Date(slot.start_time);

      return {
        id: slot.id,
        time: startDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        status: slot.status || 'Available',
        startTime: slot.start_time,
        endTime: slot.end_time
      };
    });
  },

  // Create a new availability slot.
  async createSlot(doctorProfileId, startTime, endTime) {
    if (!doctorProfileId || !startTime || !endTime) {
      throw new Error(
        'Doctor profile ID, start time and end time are required.'
      );
    }

    if (!isValidUUID(doctorProfileId)) {
      throw new Error(
        'Invalid doctor profile ID. Pass user.doctorProfile.id, not user.id.'
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      throw new Error('Invalid slot date or time.');
    }

    if (end <= start) {
      throw new Error('End time must be after start time.');
    }

    const { data, error } = await supabase
      .from('availability_slots')
      .insert({
        doctor_profile_id: doctorProfileId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        status: 'Available'
      })
      .select()
      .single();

    if (error) {
      console.error('Create availability slot error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      throw error;
    }

    return data;
  },

  // Delete an unbooked availability slot.
  async deleteSlot(slotId) {
    if (!slotId) {
      throw new Error('Slot ID is required.');
    }

    const { data, error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slotId)
      .eq('status', 'Available')
      .select()
      .maybeSingle();

    if (error) {
      console.error('Delete availability slot error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      throw error;
    }

    if (!data) {
      throw new Error(
        'Slot could not be deleted. It may already be booked or may not exist.'
      );
    }

    return data;
  }

};
