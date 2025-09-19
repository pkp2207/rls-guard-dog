// Authentication Context for RLS Guard Dog
// Created: September 19, 2025
// Description: React context for managing authentication state

'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClientComponentClient } from '@/lib/supabase';
import { getUserProfile } from '@/lib/database';
import type { UserSession } from '@/types/database';

interface SignUpData {
  role: 'student' | 'teacher' | 'head_teacher';
  first_name: string;
  last_name: string;
  school_id: string;
  [key: string]: unknown;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userSession: UserSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: SignUpData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClientComponentClient();

  const loadUserProfile = useCallback(async (currentUser: User) => {
    try {
      const { profile, role } = await getUserProfile(supabase, currentUser.id);
      
      setUserSession({
        user_id: currentUser.id,
        email: currentUser.email!,
        role,
        school_id: profile.school_id,
        profile
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserSession(null);
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserProfile(user);
    }
  }, [user, loadUserProfile]);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user);
      }
      
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUserSession(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, loadUserProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Supabase auth error:', error);
        throw new Error(`Authentication failed: ${error.message}`);
      }
      
      console.log('Sign in successful:', data);
    } catch (error) {
      setLoading(false);
      console.error('Sign in error:', error);
      throw error;
    }
  }, [supabase.auth]);

  const signUp = useCallback(async (email: string, password: string, userData: SignUpData) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) throw error;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [supabase.auth]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setLoading(false);
      throw error;
    }
  }, [supabase.auth]);

  const value = useMemo(() => ({
    user,
    session,
    userSession,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  }), [user, session, userSession, loading, signIn, signUp, signOut, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}