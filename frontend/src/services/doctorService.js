import { supabase } from '../lib/supabase.js';

export const doctorService = {
  /**
   * Fetch medical specialties from the database
   */
  async getSpecialties() {
    const { data, error } = await supabase
      .from('specialties')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[doctorService] Error fetching specialties:', error);
      throw error;
    }
    return data || [];
  },

  /**
   * Fetch approved, public, active doctors with optional specialty and search filters
   */
  async getPublicDoctors({ specialty = 'All', search = '' } = {}) {
    let query = supabase
      .from('doctor_profiles')
      .select(`
        id,
        user_id,
        qualification,
        experience_years,
        consultation_fee,
        biography,
        registration_number,
        verification_status,
        is_public,
        specialties ( id, name ),
        profiles:user_id ( id, full_name, avatar_path, phone, account_status )
      `)
      .eq('verification_status', 'APPROVED')
      .eq('is_public', true);

    const { data, error } = await query;

    if (error) {
      console.error('[doctorService] Error fetching public doctors:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Filter by active account status in profiles
    let mapped = data
      .filter(doc => !doc.profiles?.account_status || doc.profiles.account_status === 'ACTIVE')
      .map(doc => ({
        id: doc.id,
        userId: doc.user_id,
        name: doc.profiles?.full_name || 'Specialist Physician',
        specialty: doc.specialties?.name || 'General Medicine',
        specialtyId: doc.specialties?.id,
        qualification: doc.qualification || 'MBBS',
        experience: doc.experience_years ? `${doc.experience_years} Years Experience` : 'Experienced',
        experience_years: doc.experience_years || 0,
        consultation_fee: doc.consultation_fee || 0,
        registrationNumber: doc.registration_number,
        bio: doc.biography || 'Specialist physician at MediConnect Hospital.',
        img: doc.profiles?.avatar_path || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=400',
        phone: doc.profiles?.phone || ''
      }));

    if (specialty && specialty !== 'All') {
      mapped = mapped.filter(d => d.specialty.toLowerCase() === specialty.toLowerCase());
    }

    if (search) {
      const s = search.toLowerCase();
      mapped = mapped.filter(d =>
        d.name.toLowerCase().includes(s) ||
        d.specialty.toLowerCase().includes(s) ||
        d.bio.toLowerCase().includes(s) ||
        d.qualification.toLowerCase().includes(s)
      );
    }

    return mapped;
  },

  /**
   * Alias for getPublicDoctors to maintain API compatibility
   */
  async getDoctors(params) {
    return this.getPublicDoctors(params);
  },

  /**
   * Fetch doctor details by doctor profile ID
   */
  async getDoctorById(id) {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select(`
        id,
        user_id,
        qualification,
        experience_years,
        consultation_fee,
        biography,
        registration_number,
        verification_status,
        is_public,
        specialties ( id, name ),
        profiles:user_id ( id, full_name, avatar_path, phone, account_status )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('[doctorService] Error fetching doctor by id:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.profiles?.full_name || 'Specialist Physician',
      specialty: data.specialties?.name || 'General Medicine',
      specialtyId: data.specialties?.id,
      qualification: data.qualification || 'MBBS',
      experience: data.experience_years ? `${data.experience_years} Years Experience` : 'Experienced',
      experience_years: data.experience_years || 0,
      consultation_fee: data.consultation_fee || 0,
      registrationNumber: data.registration_number,
      bio: data.biography || 'Specialist physician at MediConnect Hospital.',
      img: data.profiles?.avatar_path || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=600',
      phone: data.profiles?.phone || '',
      verificationStatus: data.verification_status,
      isPublic: data.is_public
    };
  },

  /**
   * Fetch active slots for a doctor on a specific date or overall
   */
  async getDoctorSlots(doctorProfileId, dateStr) {
    let query = supabase
      .from('availability_slots')
      .select('*')
      .eq('doctor_id', doctorProfileId)
      .order('start_time', { ascending: true });

    if (dateStr) {
      const startOfDay = `${dateStr}T00:00:00Z`;
      const endOfDay = `${dateStr}T23:59:59Z`;
      query = query.gte('start_time', startOfDay).lte('start_time', endOfDay);
    } else {
      // Future slots only
      query = query.gte('start_time', new Date().toISOString());
    }

    const { data, error } = await query;
    if (error) {
      console.error('[doctorService] Error fetching doctor slots:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(slot => ({
      id: slot.id,
      time: new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startTime: slot.start_time,
      endTime: slot.end_time,
      date: new Date(slot.start_time).toISOString().split('T')[0],
      status: slot.status === 'AVAILABLE' ? 'Available' : 'Booked'
    }));
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

    if (error) {
      console.error('[doctorService] Error creating availability slot:', error);
      throw error;
    }

    return {
      id: data.id,
      time: new Date(data.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startTime: data.start_time,
      endTime: data.end_time,
      date: new Date(data.start_time).toISOString().split('T')[0],
      status: 'Available'
    };
  },

  /**
   * Delete an unbooked consultation slot
   */
  async deleteSlot(slotId) {
    const { error } = await supabase
      .from('availability_slots')
      .delete()
      .eq('id', slotId)
      .eq('status', 'AVAILABLE');

    if (error) {
      console.error('[doctorService] Error deleting slot:', error);
      throw error;
    }
    return true;
  },

  /**
   * Fetch doctor profile & credentials by Auth User ID
   */
  async getDoctorProfileByUserId(userId) {
    const { data, error } = await supabase
      .from('doctor_profiles')
      .select(`
        id,
        user_id,
        qualification,
        experience_years,
        consultation_fee,
        biography,
        registration_number,
        verification_status,
        is_public,
        specialty_id,
        specialties ( id, name ),
        profiles:user_id ( id, full_name, phone, avatar_path, role, account_status )
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[doctorService] Error fetching doctor profile by userId:', error);
      throw error;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      name: data.profiles?.full_name || 'Physician',
      phone: data.profiles?.phone || '',
      avatar: data.profiles?.avatar_path,
      specialtyId: data.specialty_id,
      specialty: data.specialties?.name || 'General Medicine',
      qualification: data.qualification || '',
      experienceYears: data.experience_years || 0,
      consultationFee: data.consultation_fee || 0,
      biography: data.biography || '',
      registrationNumber: data.registration_number || '',
      verificationStatus: data.verification_status || 'PENDING',
      isPublic: data.is_public || false,
      role: data.profiles?.role || 'DOCTOR'
    };
  },

  /**
   * Securely update permitted doctor profile fields
   * Prevents role escalation, altered license numbers, or self-approval
   */
  async updateDoctorProfile(userId, updates) {
    const {
      fullName,
      phone,
      qualification,
      experienceYears,
      consultationFee,
      biography,
      specialtyId,
      preferredTimezone
    } = updates;

    // 1. Update profiles table (Name & Phone)
    if (fullName !== undefined || phone !== undefined) {
      const profileUpdates = {};
      if (fullName !== undefined) profileUpdates.full_name = fullName;
      if (phone !== undefined) profileUpdates.phone = phone;

      const { error: pErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (pErr) {
        console.error('[doctorService] Error updating profile details:', pErr);
        throw pErr;
      }
    }

    // 2. Update doctor_profiles table
    const docUpdates = {};
    if (qualification !== undefined) docUpdates.qualification = qualification;
    if (experienceYears !== undefined) docUpdates.experience_years = Number(experienceYears);
    if (consultationFee !== undefined) docUpdates.consultation_fee = Number(consultationFee);
    if (biography !== undefined) docUpdates.biography = biography;
    if (specialtyId !== undefined) docUpdates.specialty_id = specialtyId;

    if (Object.keys(docUpdates).length > 0) {
      const { error: dErr } = await supabase
        .from('doctor_profiles')
        .update(docUpdates)
        .eq('user_id', userId);

      if (dErr) {
        console.error('[doctorService] Error updating doctor professional attributes:', dErr);
        throw dErr;
      }
    }

    // 3. Update user preferences
    if (preferredTimezone) {
      await supabase
        .from('user_preferences')
        .upsert({ user_id: userId, preferred_timezone: preferredTimezone }, { onConflict: 'user_id' });
    }

    return true;
  },

  /**
   * Fetch all authorized patients who have appointments with this doctor
   * Strictly enforces care relationship via Supabase appointments
   */
  async getDoctorPatients(doctorUserId, { search = '', page = 1, limit = 10 } = {}) {
    // 1. Resolve doctor profile id
    const { data: docProfile, error: docErr } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', doctorUserId)
      .maybeSingle();

    if (docErr) {
      console.error('[doctorService] Error finding doctor profile:', docErr);
      throw docErr;
    }

    if (!docProfile) {
      return { patients: [], totalCount: 0, totalPages: 1 };
    }

    // 2. Fetch appointments belonging to this doctor
    const { data: appointments, error: aptErr } = await supabase
      .from('appointments')
      .select(`
        id,
        patient_id,
        status,
        consultation_reason,
        created_at,
        completed_at,
        profiles:patient_id (
          id,
          full_name,
          phone,
          avatar_path
        ),
        availability_slots:slot_id (
          start_time
        )
      `)
      .eq('doctor_id', docProfile.id)
      .order('created_at', { ascending: false });

    if (aptErr) {
      console.error('[doctorService] Error fetching doctor patients:', aptErr);
      throw aptErr;
    }

    if (!appointments || appointments.length === 0) {
      return { patients: [], totalCount: 0, totalPages: 1 };
    }

    // Group appointments by unique patient
    const patientMap = new Map();

    for (const apt of appointments) {
      const pId = apt.patient_id;
      if (!pId) continue;

      const aptDate = apt.availability_slots?.start_time
        ? new Date(apt.availability_slots.start_time).toISOString().split('T')[0]
        : apt.created_at ? new Date(apt.created_at).toISOString().split('T')[0] : 'N/A';

      if (!patientMap.has(pId)) {
        patientMap.set(pId, {
          id: pId,
          name: apt.profiles?.full_name || 'Patient',
          phone: apt.profiles?.phone || 'Not provided',
          avatar: apt.profiles?.avatar_path,
          lastConsultation: apt.status === 'COMPLETED' ? aptDate : 'N/A',
          upcomingAppointment: apt.status === 'CONFIRMED' ? aptDate : 'None Scheduled',
          completedCount: apt.status === 'COMPLETED' ? 1 : 0,
          recentReason: apt.consultation_reason || 'Routine Consultation'
        });
      } else {
        const existing = patientMap.get(pId);
        if (apt.status === 'COMPLETED') {
          existing.completedCount += 1;
          if (existing.lastConsultation === 'N/A') {
            existing.lastConsultation = aptDate;
          }
        }
        if (apt.status === 'CONFIRMED' && existing.upcomingAppointment === 'None Scheduled') {
          existing.upcomingAppointment = aptDate;
        }
      }
    }

    let patientList = Array.from(patientMap.values());

    if (search) {
      const s = search.toLowerCase();
      patientList = patientList.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.phone.toLowerCase().includes(s) ||
        p.recentReason.toLowerCase().includes(s)
      );
    }

    const startIndex = (page - 1) * limit;
    const paginated = patientList.slice(startIndex, startIndex + limit);

    return {
      patients: paginated,
      totalCount: patientList.length,
      totalPages: Math.ceil(patientList.length / limit) || 1
    };
  },

  /**
   * Fetch an authorized patient record for a doctor
   * Validates care relationship: Throws an authorization error if the doctor has no appointment history with the patient
   */
  async getAuthorizedPatientRecord(doctorUserId, patientId) {
    // 1. Verify doctor profile
    const { data: docProfile, error: docErr } = await supabase
      .from('doctor_profiles')
      .select('id')
      .eq('user_id', doctorUserId)
      .maybeSingle();

    if (docErr) throw docErr;
    if (!docProfile) throw new Error('Doctor profile not found.');

    // 2. Check care relationship in PostgreSQL
    const { data: careCheck, error: careErr } = await supabase
      .from('appointments')
      .select('id, status, created_at')
      .eq('doctor_id', docProfile.id)
      .eq('patient_id', patientId)
      .limit(1);

    if (careErr) throw careErr;
    if (!careCheck || careCheck.length === 0) {
      throw new Error('Access Denied: You do not have an active or past clinical relationship with this patient.');
    }

    // 3. Load Patient Profile & patient_profiles details
    const [profileRes, patientProfileRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', patientId).maybeSingle(),
      supabase.from('patient_profiles').select('*').eq('id', patientId).maybeSingle()
    ]);

    if (profileRes.error) throw profileRes.error;
    const pProfile = profileRes.data;
    if (!pProfile) throw new Error('Patient record not found in system.');

    const pDetails = patientProfileRes.data || {};

    const patientData = {
      id: pProfile.id,
      name: pProfile.full_name,
      phone: pProfile.phone || 'Not provided',
      email: pProfile.email || '',
      dateOfBirth: pDetails.date_of_birth || null,
      gender: pDetails.gender || 'Not specified',
      bloodGroup: pDetails.blood_group || 'Not recorded',
      address: pDetails.address || '',
      emergencyContact: pDetails.emergency_contact_phone 
        ? `${pDetails.emergency_contact_name || 'Emergency Contact'} (${pDetails.emergency_contact_phone})`
        : 'Not recorded',
      allergies: pDetails.allergies || 'None recorded',
      medicalConditions: pDetails.medical_conditions || 'None recorded'
    };

    // 4. Load Medical Documents for this patient
    const { data: docs, error: docsErr } = await supabase
      .from('medical_documents')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (docsErr) {
      console.warn('[doctorService] Medical documents query notice:', docsErr.message);
    }

    const reports = (docs || []).map(d => ({
      id: d.id,
      title: d.original_filename,
      date: new Date(d.created_at).toISOString().split('T')[0],
      size: `${(d.file_size / (1024 * 1024)).toFixed(1)} MB`,
      uploadedBy: 'Medical Vault',
      path: d.storage_path
    }));

    // 5. Load Visit Summaries & Prescriptions
    const { data: summaries, error: sumErr } = await supabase
      .from('visit_summaries')
      .select(`
        id,
        created_at,
        diagnosis,
        prescribed_medications,
        summary,
        follow_up_date,
        doctor_profiles:doctor_id (
          profiles:user_id ( full_name )
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (sumErr) {
      console.warn('[doctorService] Visit summaries query notice:', sumErr.message);
    }

    const prescriptions = (summaries || [])
      .filter(s => s.prescribed_medications)
      .map(s => ({
        id: s.id,
        medication: s.prescribed_medications,
        dosage: s.diagnosis ? `Indication: ${s.diagnosis}` : 'Follow prescribed regimen',
        prescribedBy: s.doctor_profiles?.profiles?.full_name || 'Attending Physician',
        date: new Date(s.created_at).toISOString().split('T')[0]
      }));

    return {
      patient: patientData,
      reports,
      prescriptions
    };
  }
};

export default doctorService;
