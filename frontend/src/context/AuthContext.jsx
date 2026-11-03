import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to load authoritative user profile from PostgreSQL
  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return null;
    }

    try {
      // 1. Primary profile query from public.profiles
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[AuthContext] Could not load profile:', error.message);
      }

      // 2. Authoritative doctor check in public.doctor_profiles
      let doctorProfile = null;
      try {
        const { data: docData, error: docErr } = await supabase
          .from('doctor_profiles')
          .select('id, qualification, experience_years, consultation_fee, biography, registration_number, verification_status, is_public, specialty_id')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (!docErr && docData) {
          doctorProfile = docData;
        }
      } catch (docLookupErr) {
        console.warn('[AuthContext] doctor_profiles lookup warning:', docLookupErr.message);
      }

      // 3. Multi-table Authoritative Role Resolution:
      // Priority 1 (Admin): Strictly requires app_metadata.role === 'ADMIN' or profiles.role === 'ADMIN'
      // Priority 2 (Doctor): Verified strictly by doctor_profiles record, profiles.role === 'DOCTOR'
      // Priority 3 (Patient): profiles.role === 'PATIENT' or default
      const isAdmin = authUser.app_metadata?.role?.toUpperCase() === 'ADMIN' || profile?.role?.toUpperCase() === 'ADMIN';
      const isDoctor = Boolean(doctorProfile) || profile?.role?.toUpperCase() === 'DOCTOR' || authUser.user_metadata?.role?.toUpperCase() === 'DOCTOR';
      const isPatient = (profile?.role?.toUpperCase() === 'PATIENT' || authUser.user_metadata?.role?.toUpperCase() === 'PATIENT') && !isDoctor && !isAdmin;

      let resolvedRole = null;
      if (isAdmin) {
        resolvedRole = 'admin';
      } else if (isDoctor) {
        resolvedRole = 'doctor';
      } else if (isPatient) {
        resolvedRole = 'patient';
      } else {
        resolvedRole = profile?.role ? profile.role.toLowerCase() : 'patient';
      }

      // 4. Safe self-healing of profile row in PostgreSQL if missing
      if (authUser.id && !profile && resolvedRole) {
        try {
          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert({
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email?.split('@')[0],
              phone: authUser.user_metadata?.phone || null,
              role: resolvedRole.toUpperCase(),
              account_status: 'ACTIVE'
            }, { onConflict: 'id' })
            .select()
            .maybeSingle();

          if (createdProfile) {
            profile = createdProfile;
          }
        } catch (healErr) {
          console.warn('[AuthContext] Profile self-heal notice:', healErr.message);
        }
      }

      const name = profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0];

      const fullUser = {
        id: authUser.id,
        email: authUser.email,
        name,
        role: resolvedRole,
        accountStatus: profile?.account_status || 'ACTIVE',
        avatarPath: profile?.avatar_path,
        phone: profile?.phone,
        profile: profile || null,
        doctorProfile: doctorProfile || null,
        profileIncomplete: (!profile && !doctorProfile) || !resolvedRole
      };

      setUser(fullUser);
      return fullUser;
    } catch (err) {
      console.error('[AuthContext] Error in fetchUserProfile:', err);
      const metaRole = authUser.user_metadata?.role?.toUpperCase();
      let fallbackRole = 'patient';
      if (authUser.app_metadata?.role?.toUpperCase() === 'ADMIN') {
        fallbackRole = 'admin';
      } else if (metaRole === 'DOCTOR') {
        fallbackRole = 'doctor';
      }

      const fallbackUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        role: fallbackRole,
        accountStatus: 'ACTIVE',
        profile: null,
        doctorProfile: null,
        profileIncomplete: true
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial Session Check with Supabase
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);

      if (initialSession?.user) {
        fetchUserProfile(initialSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    }).catch(err => {
      console.error('[AuthContext] Error getting initial session:', err);
      if (mounted) setLoading(false);
    });

    // 2. Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      setSession(newSession);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (newSession?.user) {
          await fetchUserProfile(newSession.user);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const login = async ({ email, password }) => {
    const res = await authService.signIn({ email, password });
    if (res?.user) {
      const fullUser = await fetchUserProfile(res.user);
      if (fullUser?.accountStatus === 'DISABLED') {
        await authService.signOut();
        setUser(null);
        setSession(null);
        throw new Error('This account has been disabled. Please contact hospital administration.');
      }
      return fullUser;
    }
    return res;
  };

  const register = async (signupData) => {
    const res = await authService.signUp(signupData);
    return res;
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
    setSession(null);
  };

  const refreshProfile = async () => {
    if (session?.user) {
      return await fetchUserProfile(session.user);
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      login, 
      register, 
      logout, 
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
