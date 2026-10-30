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

    // Fetch user profile to verify status
    if (data.user) {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profileErr && profile) {
        if (profile.account_status === 'DISABLED') {
          await supabase.auth.signOut();
          throw new Error('Your account has been deactivated. Please contact support.');
        }
        return { session: data.session, user: { ...data.user, profile } };
      }
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

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.warn('Error fetching profile:', error.message);
      // Preserve role from user metadata if available; do NOT silently default doctors to patient
      const metaRole = user.user_metadata?.role?.toUpperCase();
      const resolvedRole = metaRole === 'DOCTOR' ? 'DOCTOR' : (user.app_metadata?.role === 'ADMIN' ? 'ADMIN' : (metaRole === 'PATIENT' ? 'PATIENT' : null));
      return { 
        id: user.id, 
        email: user.email, 
        role: resolvedRole, 
        full_name: user.user_metadata?.full_name || user.email,
        profileIncomplete: !profile
      };
    }

    return profile;
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
