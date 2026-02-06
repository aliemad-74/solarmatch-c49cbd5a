import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  reports_generated: number;
  report_limit: number;
  created_at: string;
  updated_at: string;
}

interface UserAuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  canGenerateReport: boolean;
  remainingReports: number;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, name: string, phone?: string) => Promise<{ error: string | null }>;
  signInWithOAuth: (provider: 'google' | 'apple') => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  recordReportGeneration: (locationName?: string, systemSizeKw?: number) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const UserAuthContext = createContext<UserAuthContextType | undefined>(undefined);

export function UserAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const canGenerateReport = profile ? profile.reports_generated < profile.report_limit : false;
  const remainingReports = profile ? Math.max(0, profile.report_limit - profile.reports_generated) : 0;

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      return data as Profile | null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Use setTimeout to avoid race conditions
        setTimeout(async () => {
          const profileData = await fetchProfile(currentSession.user.id);
          setProfile(profileData);
          setIsLoading(false);
        }, 0);
      } else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        const profileData = await fetchProfile(existingSession.user.id);
        setProfile(profileData);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    name: string, 
    phone?: string
  ): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            name,
            phone,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signInWithOAuth = async (provider: 'google' | 'apple'): Promise<{ error: string | null }> => {
    try {
      const { error } = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const recordReportGeneration = async (locationName?: string, systemSizeKw?: number): Promise<boolean> => {
    if (!user || !profile) return false;

    try {
      // Get client IP
      let ip = 'unknown';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ip = data.ip;
      } catch {}

      // Insert into report_history
      await supabase
        .from('report_history')
        .insert({
          user_id: profile.id, // Legacy column
          auth_user_id: user.id, // New column
          location_name: locationName || null,
          system_size_kw: systemSizeKw || null,
          ip_address: ip
        });

      // Increment reports_generated
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          reports_generated: profile.reports_generated + 1
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data as Profile);
      return true;
    } catch (error) {
      console.error('Error recording report generation:', error);
      return false;
    }
  };

  return (
    <UserAuthContext.Provider value={{
      user,
      session,
      profile,
      isLoading,
      canGenerateReport,
      remainingReports,
      signInWithEmail,
      signUpWithEmail,
      signInWithOAuth,
      signOut,
      recordReportGeneration,
      refreshProfile
    }}>
      {children}
    </UserAuthContext.Provider>
  );
}

export function useUserAuth() {
  const context = useContext(UserAuthContext);
  if (context === undefined) {
    throw new Error('useUserAuth must be used within a UserAuthProvider');
  }
  return context;
}
