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
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.warn('[AuthContext] Could not load profile:', error.message);
      }

      const role = (profile?.role || authUser.user_metadata?.role || 'PATIENT').toLowerCase();
      const name = profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0];

      const fullUser = {
        id: authUser.id,
        email: authUser.email,
        name,
        role,
        accountStatus: profile?.account_status || 'ACTIVE',
        avatarPath: profile?.avatar_path,
        phone: profile?.phone,
        profile: profile || null
      };

      setUser(fullUser);
      return fullUser;
    } catch (err) {
      console.error('[AuthContext] Error in fetchUserProfile:', err);
      const fallbackUser = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.email?.split('@')[0],
        role: 'patient',
        accountStatus: 'ACTIVE',
        profile: null
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