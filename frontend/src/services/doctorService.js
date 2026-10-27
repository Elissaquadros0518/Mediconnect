import { supabase } from '../lib/supabase';

// Fallback seed doctors for development or before initial doctor registration
export const FALLBACK_DOCTORS = [
  {
    id: '22222222-2222-2222-2222-222222222201',
    name: 'Dr. Rajesh Sharma, MD',
    specialty: 'Cardiology',
    qualification: 'DM (Cardiology), AIIMS New Delhi',
    experience: '14 Years Experience',
    experience_years: 14,
    consultation_fee: 1200,
    rating: 4.9,
    reviewsCount: 142,
    availability: 'Mon - Sat (09:00 AM - 04:00 PM)',
    bio: 'Expert in interventional cardiology, coronary angioplasty, and advanced heart failure management.',
    img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    reviews: [
      { author: 'Amit Patel', comment: 'Extremely polite and explained my father’s heart condition with great clarity.' },
      { author: 'Priya Deshmukh', comment: 'Best cardiologist in the hospital. Highly recommended!' }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222202',
    name: 'Dr. Sneha Kulkarni, MBBS, DNB',
    specialty: 'General Medicine',
    qualification: 'Gold Medalist, KEM Hospital Mumbai',
    experience: '9 Years Experience',
    experience_years: 9,
    consultation_fee: 800,
    rating: 4.8,
    reviewsCount: 98,
    availability: 'Mon - Fri (10:00 AM - 06:00 PM)',
    bio: 'Specializes in chronic disease management, diabetes care, infectious diseases, and preventive health checks.',
    img: 'https://images.unsplash.com/photo-1594824813578-834e062eb1d1?auto=format&fit=crop&q=80&w=400',
    reviews: [
      { author: 'Rohan Gupta', comment: 'Very thorough during checkups and takes time to listen to symptoms.' }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222203',
    name: 'Dr. Vikram Iyer, MS, MCh',
    specialty: 'Pediatrics',
    qualification: 'Pediatric Specialist, CMC Vellore',
    experience: '12 Years Experience',
    experience_years: 12,
    consultation_fee: 1000,
    rating: 5.0,
    reviewsCount: 180,
    availability: 'Mon - Sat (08:30 AM - 02:00 PM)',
    bio: 'Dedicated child specialist focusing on neonatal care, childhood immunizations, and developmental pediatrics.',
    img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    reviews: [
      { author: 'Ananya Roy', comment: 'Wonderful with kids! My toddler was not scared at all.' }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222204',
    name: 'Dr. Pooja Menon, MS',
    specialty: 'Emergency Care',
    qualification: 'Head of Triage, MediConnect Hospital',
    experience: '11 Years Experience',
    experience_years: 11,
    consultation_fee: 1500,
    rating: 4.9,
    reviewsCount: 215,
    availability: '24/7 On-Duty Roster',
    bio: 'Specialized in critical care trauma response, acute medical stabilization, and emergency triage protocols.',
    img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
    reviews: [
      { author: 'Sameer Joshi', comment: 'Prompt emergency handling and very reassuring staff.' }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222205',
    name: 'Dr. Amit Deshmukh, DM',
    specialty: 'Neurology',
    qualification: 'Consultant Neurologist, NIMHANS',
    experience: '16 Years Experience',
    experience_years: 16,
    consultation_fee: 1800,
    rating: 4.9,
    reviewsCount: 130,
    availability: 'Tue, Thu, Sat (11:00 AM - 05:00 PM)',
    bio: 'Expert in stroke management, epilepsy care, migraine disorders, and neuro-diagnostics.',
    img: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
    reviews: [
      { author: 'Meera Nair', comment: 'An exceptional neurologist. Truly grateful for his diagnosis.' }
    ]
  },
  {
    id: '22222222-2222-2222-2222-222222222206',
    name: 'Dr. Neha Agarwal, MS (Ortho)',
    specialty: 'Orthopedics',
    qualification: 'Joint Replacement Fellow, Lilavati Hospital',
    experience: '10 Years Experience',
    experience_years: 10,
    consultation_fee: 1100,
    rating: 4.8,
    reviewsCount: 104,
    availability: 'Mon - Fri (09:30 AM - 03:30 PM)',
    bio: 'Specializing in arthroscopy, sports injuries, knee replacements, and spinal rehabilitation.',
    img: 'https://images.unsplash.com/photo-1594824813578-834e062eb1d1?auto=format&fit=crop&q=80&w=400',
    reviews: [
      { author: 'Karan Malhotra', comment: 'Surgery recovery went smoothly thanks to her guidance.' }
    ]
  }
];

export const doctorService = {
  /**
   * Fetch medical specialties
   */
  async getSpecialties() {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error || !data || data.length === 0) {
        return [
          { id: '1', name: 'Cardiology' },
          { id: '2', name: 'General Medicine' },
          { id: '3', name: 'Pediatrics' },
          { id: '4', name: 'Emergency Care' },
          { id: '5', name: 'Neurology' },
          { id: '6', name: 'Orthopedics' }
        ];
      }
      return data;
    } catch {
      return [
        { id: '1', name: 'Cardiology' },
        { id: '2', name: 'General Medicine' },
        { id: '3', name: 'Pediatrics' },
        { id: '4', name: 'Emergency Care' },
        { id: '5', name: 'Neurology' },
        { id: '6', name: 'Orthopedics' }
      ];
    }
  },

  /**
   * Fetch approved, public doctors with search and filter
   */
  async getPublicDoctors({ specialty = 'All', search = '' } = {}) {
    try {
      let query = supabase
        .from('doctor_profiles')
        .select(`
          id,
          qualification,
          experience_years,
          consultation_fee,
          biography,
          verification_status,
          is_public,
          specialties ( id, name ),
          profiles:user_id ( id, full_name, avatar_path, phone )
        `)
        .eq('verification_status', 'APPROVED')
        .eq('is_public', true);

      const { data, error } = await query;

      if (!error && data && data.length > 0) {
        let mapped = data.map(doc => ({
          id: doc.id,
          name: doc.profiles?.full_name || 'Specialist Doctor',
          specialty: doc.specialties?.name || 'General Medicine',
          qualification: doc.qualification,
          experience: `${doc.experience_years} Years Experience`,
          experience_years: doc.experience_years,
          consultation_fee: doc.consultation_fee,
          rating: 4.9,
          reviewsCount: 120,
          availability: 'Mon - Sat (09:00 AM - 04:00 PM)',
          bio: doc.biography || 'Specialist doctor at MediConnect Hospital.',
          img: doc.profiles?.avatar_path || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
          reviews: [
            { author: 'Patient Review', comment: 'Very professional and helpful consultation.' }
          ]
        }));

        if (specialty !== 'All') {
          mapped = mapped.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
        }
        if (search) {
          const s = search.toLowerCase();
          mapped = mapped.filter(d => 
            d.name.toLowerCase().includes(s) || 
            d.specialty.toLowerCase().includes(s) || 
            d.bio.toLowerCase().includes(s)
          );
        }
        return mapped;
      }
    } catch (err) {
      console.warn('[doctorService] Using fallback doctors:', err.message);
    }

    // Fallback filter
    let results = [...FALLBACK_DOCTORS];
    if (specialty !== 'All') {
      results = results.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      results = results.filter(d => 
        d.name.toLowerCase().includes(s) || 
        d.specialty.toLowerCase().includes(s) || 
        d.bio.toLowerCase().includes(s)
      );
    }
    return results;
  },

  /**
   * Fetch doctor details by ID
   */
  async getDoctorById(id) {
    try {
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select(`
          id,
          qualification,
          experience_years,
          consultation_fee,
          biography,
          verification_status,
          is_public,
          specialties ( id, name ),
          profiles:user_id ( id, full_name, avatar_path, phone )
        `)
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          name: data.profiles?.full_name || 'Specialist Doctor',
          specialty: data.specialties?.name || 'General Medicine',
          qualification: data.qualification,
          experience: `${data.experience_years} Years Experience`,
          consultation_fee: data.consultation_fee,
          rating: 4.9,
          reviewsCount: 142,
          availability: 'Mon - Sat (09:00 AM - 04:00 PM)',
          bio: data.biography || 'Specialist doctor at MediConnect Hospital.',
          img: data.profiles?.avatar_path || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600',
          reviews: [
            { author: 'Amit Patel', rating: 5, comment: 'Extremely polite and explained condition with great clarity.' },
            { author: 'Priya Deshmukh', rating: 5, comment: 'Best doctor in the hospital. Highly recommended.' }
          ]
        };
      }
    } catch (err) {
      console.warn('[doctorService] getDoctorById fallback:', err.message);
    }

    const fallback = FALLBACK_DOCTORS.find(d => String(d.id) === String(id)) || FALLBACK_DOCTORS[0];
    return fallback;
  },

  /**
   * Fetch active slots for a doctor on a specific date
   */
  async getDoctorSlots(doctorProfileId, dateStr) {
    try {
      let query = supabase
        .from('availability_slots')
        .select('*')
        .eq('doctor_id', doctorProfileId)
        .order('start_time', { ascending: true });

      if (dateStr) {
        const startOfDay = `${dateStr}T00:00:00Z`;
        const endOfDay = `${dateStr}T23:59:59Z`;
        query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data.map(slot => ({
          id: slot.id,
          time: new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          startTime: slot.start_time,
          endTime: slot.end_time,
          status: slot.status === 'AVAILABLE' ? 'Available' : 'Booked'
        }));
      }
    } catch (err) {
      console.warn('[doctorService] getDoctorSlots fallback:', err.message);
    }

    // Default mock slots for smooth demonstration
    return [
      { id: 'slot-1', time: '09:00 AM', status: 'Available' },
      { id: 'slot-2', time: '10:30 AM', status: 'Booked' },
      { id: 'slot-3', time: '11:45 AM', status: 'Available' },
      { id: 'slot-4', time: '02:00 PM', status: 'Available' }
    ];
  },

  /**
   * Create a new consultation slot for the logged-in doctor
   */
  async createSlot({ doctorProfileId, startTime, endTime }) {
    const { data, error } = await supabase
      .from('availability_slots')
      .insert({
        doctor_id: doctorProfileId,
        start_time: startTime,
        end_time: endTime,
        status: 'AVAILABLE'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete an unbooked consultation slot
   */
  async deleteSlot(slotId) {
    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slotId);

    if (error) throw error;
    return true;
  }
};

export default doctorService;
