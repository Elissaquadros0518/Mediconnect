import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to load profile from PostgreSQL
  const fetchUserProfile = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return null;
    }

    try {
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('[AuthContext] Could not load profile:', error.message);
      }

      // If no profile exists yet in the database, attempt self-healing from auth metadata
      const metaRole = authUser.user_metadata?.role?.toUpperCase();
      const safeMetaRole = metaRole === 'DOCTOR' ? 'DOCTOR' : (authUser.app_metadata?.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'PATIENT');

      if (!profile && authUser.id) {
        try {
          const { data: createdProfile } = await supabase
            .from('profiles')
            .upsert({
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
              phone: authUser.user_metadata?.phone || null,
              role: safeMetaRole,
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

      // Determine authoritative role:
      // Priority 1: PostgreSQL `profiles` table (authoritative)
      // Priority 2: Supabase Auth metadata (if profiles table was unreachable during registration)
      // Requirement: NEVER silently convert doctor or admin to patient when lookup fails
      let resolvedRole = null;
      if (profile?.role) {
        resolvedRole = profile.role.toLowerCase();
      } else if (authUser.app_metadata?.role?.toUpperCase() === 'ADMIN') {
        resolvedRole = 'admin';
      } else if (authUser.user_metadata?.role?.toUpperCase() === 'DOCTOR') {
        resolvedRole = 'doctor';
      } else if (authUser.user_metadata?.role?.toUpperCase() === 'PATIENT') {
        resolvedRole = 'patient';
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
        profileIncomplete: !profile || !resolvedRole
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

    // 1. Initial Session Check
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
    <AuthContext.Provider value={{ user, session, loading, login, register, logout, refreshProfile }}>
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