import { supabase } from '../lib/supabase';

export const authService = {
  /**
   * Register a new patient or doctor account
   */
  async signUp({ email, password, fullName, phone, role = 'PATIENT', specialty, medicalLicense, qualification }) {
    // Security check: Force PATIENT if ADMIN was somehow passed
    const safeRole = role.toUpperCase() === 'DOCTOR' ? 'DOCTOR' : 'PATIENT';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || null,
          role: safeRole,
          specialty: specialty || null,
          registration_number: medicalLicense || null,
          qualification: qualification || (safeRole === 'DOCTOR' ? 'Specialist Physician' : null)
        }
      }
    });

    if (error) throw error;

    // Proactively initialize profile row if an active session is returned
    if (data?.user && data?.session) {
      try {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: fullName,
            phone: phone || null,
            role: safeRole,
            account_status: 'ACTIVE'
          }, { onConflict: 'id' });

        if (safeRole === 'DOCTOR') {
          await supabase
            .from('doctor_profiles')
            .upsert({
              user_id: data.user.id,
              qualification: qualification || 'Specialist Physician',
              registration_number: medicalLicense || `MED-REG-${data.user.id.slice(0, 8)}`,
              verification_status: 'PENDING',
              is_public: false
            }, { onConflict: 'user_id' });
        }
      } catch (profileInitErr) {
        console.warn('[authService] Direct profile sync notice:', profileInitErr.message);
      }
    }

    return data;
  },

  /**
   * Authenticate user with email and password
   */
  async signIn({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Fetch user profile and doctor profile to verify status and authentic role
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile && profile.account_status === 'DISABLED') {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // Check doctor_profiles table
      let doctorProfile = null;
      try {
        const { data: docData } = await supabase
          .from('doctor_profiles')
          .select('id, qualification, experience_years, consultation_fee, biography, registration_number, verification_status, is_public, specialty_id')
          .eq('user_id', data.user.id)
          .maybeSingle();
        if (docData) doctorProfile = docData;
      } catch (docErr) {
        console.warn('[authService] doctor_profiles lookup notice:', docErr.message);
      }

      const isAdmin = data.user.app_metadata?.role?.toUpperCase() === 'ADMIN' || profile?.role?.toUpperCase() === 'ADMIN';
      const isDoctor = Boolean(doctorProfile) || profile?.role?.toUpperCase() === 'DOCTOR' || data.user.user_metadata?.role?.toUpperCase() === 'DOCTOR';
      const resolvedRole = isAdmin ? 'ADMIN' : (isDoctor ? 'DOCTOR' : (profile?.role || (data.user.user_metadata?.role?.toUpperCase() === 'PATIENT' ? 'PATIENT' : null)));

      const fullProfile = profile ? { ...profile, role: resolvedRole } : { id: data.user.id, role: resolvedRole };

      return { 
        session: data.session, 
        user: { 
          ...data.user, 
          profile: fullProfile, 
          role: resolvedRole ? resolvedRole.toLowerCase() : null, 
          doctorProfile 
        } 
      };
    }

    return data;
  },

  /**
   * Sign out current user and clear local cached sessions
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem('mediconnect_user');
    localStorage.removeItem('mock_role');
    localStorage.removeItem('mock_user_id');
    if (error) throw error;
  },

  /**
   * Send password recovery email
   */
  async resetPassword(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`
    });
    if (error) throw error;
    return data;
  },

  /**
   * Update current user's password
   */
  async updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    return data;
  },

  /**
   * Retrieve current authenticated user and profile
   */
  async getCurrentProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    let doctorProfile = null;
    try {
      const { data: docData } = await supabase
        .from('doctor_profiles')
        .select('id, qualification, experience_years, consultation_fee, biography, registration_number, verification_status, is_public, specialty_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (docData) doctorProfile = docData;
    } catch (docErr) {
      console.warn('[authService] getCurrentProfile doctor_profiles notice:', docErr.message);
    }

    const isAdmin = user.app_metadata?.role?.toUpperCase() === 'ADMIN' || profile?.role?.toUpperCase() === 'ADMIN';
    const isDoctor = Boolean(doctorProfile) || profile?.role?.toUpperCase() === 'DOCTOR' || user.user_metadata?.role?.toUpperCase() === 'DOCTOR';
    const resolvedRole = isAdmin ? 'ADMIN' : (isDoctor ? 'DOCTOR' : (profile?.role || (user.user_metadata?.role?.toUpperCase() === 'PATIENT' ? 'PATIENT' : null)));

    return { 
      id: user.id, 
      email: user.email, 
      role: resolvedRole ? resolvedRole.toLowerCase() : null, 
      full_name: profile?.full_name || user.user_metadata?.full_name || user.email,
      profile: profile || null,
      doctorProfile: doctorProfile || null,
      profileIncomplete: (!profile && !doctorProfile) || !resolvedRole
    };
  },

  /**
   * Update profile fields (full_name, phone, avatar_path)
   */
  async updateProfile(userId, updates) {
    // Exclude security critical fields from client updates
    const { role, account_status, id, created_at, ...safeUpdates } = updates;

    const { data, error } = await supabase
      .from('profiles')
      .update(safeUpdates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

export default authService;
