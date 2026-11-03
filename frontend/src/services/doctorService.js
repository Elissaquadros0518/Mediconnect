
import { supabase } from '../lib/supabase';

export const doctorService = {
  // Fetch approved and publicly visible doctors
  async getPublicDoctors() {
    // First, fetch doctor profiles
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

    if (!doctors || doctors.length === 0) {
      return [];
    }

    // Fetch names from the profiles table
    const userIds = doctors.map(doc => doc.user_id);

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    if (profileError) {
      console.error('Doctor names error:', profileError);
      throw profileError;
    }

    // Match doctor profiles with their user profiles
    const profileMap = new Map(
      (profiles || []).map(profile => [
        profile.id,
        profile.full_name
      ])
    );

    return doctors.map(doc => ({
      id: doc.id,
      name: profileMap.get(doc.user_id) || 'Registered Doctor',
      specialty: doc.specialty,
      qualification: doc.qualification || 'Not provided',
      experience: doc.experience_years != null
        ? `${doc.experience_years} years`
        : 'Not provided',
      location: 'Hospital Branch',
      rating: null,
      consultation_fee: doc.consultation_fee,
      biography: doc.biography
    }));
  },

  // Fetch available slots for selected doctor
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

    if (error) {
      console.error('Availability slots error:', error);
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
  }
};
