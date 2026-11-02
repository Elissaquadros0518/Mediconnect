import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const DEMO_DOCTOR_USER = {
  id: 'demo-doctor-uuid-001',
  email: 'doctor@mediconnect.cloud',
  name: 'Dr. Rajesh Sharma, MD',
  role: 'doctor',
  accountStatus: 'ACTIVE',
  phone: '+91 98201 11000',
  isDemo: true,
  profile: {
    id: 'demo-doctor-uuid-001',
    full_name: 'Dr. Rajesh Sharma, MD',
    role: 'DOCTOR',
    account_status: 'ACTIVE',
    phone: '+91 98201 11000'
  },
  profileIncomplete: false
};

export const DEMO_PATIENT_USER = {
  id: 'demo-patient-uuid-001',
  email: 'patient@mediconnect.cloud',
  name: 'Amit Patel',
  role: 'patient',
  accountStatus: 'ACTIVE',
  phone: '+91 98201 23456',
  isDemo: true,
  profile: {
    id: 'demo-patient-uuid-001',
    full_name: 'Amit Patel',
    role: 'PATIENT',
    account_status: 'ACTIVE',
    phone: '+91 98201 23456'
  },
  profileIncomplete: false
};

export const DEMO_ADMIN_USER = {
  id: 'demo-admin-uuid-001',
  email: 'admin@mediconnect.cloud',
  name: 'System Administrator',
  role: 'admin',
  accountStatus: 'ACTIVE',
  phone: '+91 98201 99999',
  isDemo: true,
  profile: {
    id: 'demo-admin-uuid-001',
    full_name: 'System Administrator',
    role: 'ADMIN',
    account_status: 'ACTIVE',
    phone: '+91 98201 99999'
  },
  profileIncomplete: false
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to load profile from PostgreSQL with comprehensive doctor verification
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
      // Priority 1 (Admin): Strictly requires app_metadata.role === 'ADMIN' or profiles.role === 'ADMIN' (never user_metadata)
      // Priority 2 (Doctor): Verified strictly by doctor_profiles record, profiles.role === 'DOCTOR', or registration metadata
      // Priority 3 (Patient): profiles.role === 'PATIENT' or user_metadata.role === 'PATIENT' (and neither doctor nor admin)
      // Requirement: No hardcoded email overrides, no fake APPROVED statuses, never silently demote doctors to patient
      const isAdmin = authUser.app_metadata?.role?.toUpperCase() === 'ADMIN' || profile?.role?.toUpperCase() === 'ADMIN';
      const isDoctor = Boolean(doctorProfile) || 
                       profile?.role?.toUpperCase() === 'DOCTOR' || 
                       authUser.user_metadata?.role?.toUpperCase() === 'DOCTOR';
      const isPatient = (profile?.role?.toUpperCase() === 'PATIENT' || authUser.user_metadata?.role?.toUpperCase() === 'PATIENT') && !isDoctor && !isAdmin;

      let resolvedRole = null;
      if (isAdmin) {
        resolvedRole = 'admin';
      } else if (isDoctor) {
        resolvedRole = 'doctor';
      } else if (isPatient) {
        resolvedRole = 'patient';
      }

      // 4. Safe self-healing of profile row in PostgreSQL
      if (authUser.id) {
        const targetDbRole = resolvedRole ? resolvedRole.toUpperCase() : null;

        // If no profile row exists, initialize with verified role
        if (!profile && targetDbRole) {
          try {
            const { data: createdProfile } = await supabase
              .from('profiles')
              .upsert({
                id: authUser.id,
                full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
                phone: authUser.user_metadata?.phone || null,
                role: targetDbRole,
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
        } else if (profile && isDoctor && profile.role === 'PATIENT') {
          // If profile was erroneously created as PATIENT before doctor trigger ran, sync to DOCTOR
          try {
            const { data: syncedProfile } = await supabase
              .from('profiles')
              .update({ role: 'DOCTOR' })
              .eq('id', authUser.id)
              .select()
              .maybeSingle();

            if (syncedProfile) {
              profile = syncedProfile;
            }
          } catch (syncErr) {
            console.warn('[AuthContext] Role synchronization notice:', syncErr.message);
          }
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
      // Resilient fallback: preserve the user's role from auth metadata, never silently force doctor or admin to patient
      const metaRole = authUser.user_metadata?.role?.toUpperCase();
      let fallbackRole = null;
      if (authUser.app_metadata?.role?.toUpperCase() === 'ADMIN') {
        fallbackRole = 'admin';
      } else if (metaRole === 'DOCTOR') {
        fallbackRole = 'doctor';
      } else if (metaRole === 'PATIENT') {
        fallbackRole = 'patient';
      }

      const fallbackUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        role: fallbackRole,
        accountStatus: 'ACTIVE',
        profile: null,
        profileIncomplete: true
      };
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Check for explicit local development demo query parameter (?demo=doctor|patient|admin)
    if (import.meta.env.DEV && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDemo = urlParams.get('demo');
      const currentPath = window.location.pathname;

      // Navigating to public authentication screens without demo query param resets any lingering demo mode
      if (!urlDemo && (currentPath === '/login' || currentPath === '/register' || currentPath === '/forgot-password')) {
        localStorage.removeItem('mediconnect_demo_mode');
      }

      // Explicit URL demo param always activates preview mode immediately
      if (urlDemo) {
        let activeRole = 'doctor';
        if (urlDemo === 'admin') activeRole = 'admin';
        else if (urlDemo === 'patient') activeRole = 'patient';
        else if (urlDemo === 'doctor' || urlDemo === 'true') activeRole = 'doctor';

        localStorage.setItem('mediconnect_demo_mode', activeRole);
        const demoUser = activeRole === 'admin' ? DEMO_ADMIN_USER : activeRole === 'patient' ? DEMO_PATIENT_USER : DEMO_DOCTOR_USER;
        setUser(demoUser);
        setLoading(false);
        return;
      }
    }

    // 1. Initial Session Check with Supabase
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (!mounted) return;
      setSession(initialSession);

      if (initialSession?.user) {
        // Authenticated user exists - clear demo mode and load authoritative profile
        if (typeof window !== 'undefined') {
          localStorage.removeItem('mediconnect_demo_mode');
        }
        fetchUserProfile(initialSession.user).finally(() => {
          if (mounted) setLoading(false);
        });
      } else {
        // No active Supabase session: check if dev demo mode was persisted on portal routes
        if (import.meta.env.DEV && typeof window !== 'undefined') {
          const storedDemo = localStorage.getItem('mediconnect_demo_mode');
          const currentPath = window.location.pathname;
          const isPortalRoute = currentPath.startsWith('/doctor') || currentPath.startsWith('/patient') || currentPath.startsWith('/admin');

          if (storedDemo && isPortalRoute) {
            let activeRole = storedDemo === 'admin' ? 'admin' : storedDemo === 'patient' ? 'patient' : 'doctor';
            const demoUser = activeRole === 'admin' ? DEMO_ADMIN_USER : activeRole === 'patient' ? DEMO_PATIENT_USER : DEMO_DOCTOR_USER;
            setUser(demoUser);
            setLoading(false);
            return;
          }
        }
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
          if (typeof window !== 'undefined') {
            localStorage.removeItem('mediconnect_demo_mode');
          }
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
    // Clear demo mode when performing real user login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mediconnect_demo_mode');
    }
    const res = await authService.signIn({ email, password });
    if (res?.user) {
      const fullUser = await fetchUserProfile(res.user);
      return fullUser;
    }
    return res;
  };

  const register = async (signupData) => {
    const res = await authService.signUp(signupData);
    return res;
  };

  const switchDemoRole = (role) => {
    if (!import.meta.env.DEV) return;
    const safeRole = role.toLowerCase();
    if (typeof window !== 'undefined') {
      localStorage.setItem('mediconnect_demo_mode', safeRole);
    }
    const demoUser = safeRole === 'admin' ? DEMO_ADMIN_USER : safeRole === 'patient' ? DEMO_PATIENT_USER : DEMO_DOCTOR_USER;
    setUser(demoUser);
    setLoading(false);
  };

  const enterDemoDoctorMode = () => {
    switchDemoRole('doctor');
  };

  const enterDemoPatientMode = () => {
    switchDemoRole('patient');
  };

  const enterDemoAdminMode = () => {
    switchDemoRole('admin');
  };

  const exitDemoMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mediconnect_demo_mode');
    }
    setUser(null);
    setSession(null);
    setLoading(false);
  };

  const logout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mediconnect_demo_mode');
    }
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
      refreshProfile,
      switchDemoRole,
      enterDemoDoctorMode,
      enterDemoPatientMode,
      enterDemoAdminMode,
      exitDemoMode,
      isDemoMode: Boolean(user?.isDemo)
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