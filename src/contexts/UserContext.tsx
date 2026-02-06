import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  status: string;
  reports_generated: number;
  report_limit: number;
  ip_address: string | null;
  created_at: string;
}

interface UserContextType {
  user: AppUser | null;
  isLoading: boolean;
  canGenerateReport: boolean;
  remainingReports: number;
  registerUser: (name: string, email: string, phone: string) => Promise<{ success: boolean; error?: string }>;
  checkUserByEmail: (email: string) => Promise<AppUser | null>;
  recordReportGeneration: (locationName?: string, systemSizeKw?: number) => Promise<boolean>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Get client IP address
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'unknown';
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('solar_app_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Refresh user data from database
        refreshUserData(parsedUser.email);
      } catch {
        localStorage.removeItem('solar_app_user');
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUserData = async (email: string) => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setUser(data as AppUser);
        localStorage.setItem('solar_app_user', JSON.stringify(data));
      } else {
        localStorage.removeItem('solar_app_user');
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
      localStorage.removeItem('solar_app_user');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const canGenerateReport = user ? user.reports_generated < user.report_limit : false;
  const remainingReports = user ? Math.max(0, user.report_limit - user.reports_generated) : 0;

  const registerUser = async (name: string, email: string, phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const ip = await getClientIP();
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingUser) {
        // User already exists, just load their data
        setUser(existingUser as AppUser);
        localStorage.setItem('solar_app_user', JSON.stringify(existingUser));
        return { success: true };
      }

      // Create new user
      const { data, error } = await supabase
        .from('app_users')
        .insert({
          email: normalizedEmail,
          name: name.trim(),
          phone: phone.trim(),
          ip_address: ip,
          status: 'verified', // Auto-verified (no email verification for now)
          reports_generated: 0,
          report_limit: 1
        })
        .select()
        .single();

      if (error) {
        console.error('Registration error:', error);
        if (error.message.includes('Invalid email')) {
          return { success: false, error: 'invalid_email' };
        }
        if (error.message.includes('Invalid phone')) {
          return { success: false, error: 'invalid_phone' };
        }
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          // User was created between our check and insert, fetch them
          const { data: fetchedUser } = await supabase
            .from('app_users')
            .select('*')
            .eq('email', normalizedEmail)
            .maybeSingle();
          
          if (fetchedUser) {
            setUser(fetchedUser as AppUser);
            localStorage.setItem('solar_app_user', JSON.stringify(fetchedUser));
            return { success: true };
          }
        }
        return { success: false, error: 'registration_failed' };
      }

      setUser(data as AppUser);
      localStorage.setItem('solar_app_user', JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'registration_failed' };
    }
  };

  const checkUserByEmail = async (email: string): Promise<AppUser | null> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) throw error;
      return data as AppUser | null;
    } catch (error) {
      console.error('Error checking user:', error);
      return null;
    }
  };

  const recordReportGeneration = async (locationName?: string, systemSizeKw?: number): Promise<boolean> => {
    if (!user) return false;

    try {
      const ip = await getClientIP();

      // Insert into report_history
      await supabase
        .from('report_history')
        .insert({
          user_id: user.id,
          location_name: locationName || null,
          system_size_kw: systemSizeKw || null,
          ip_address: ip
        });

      // Increment reports_generated
      const { data, error } = await supabase
        .from('app_users')
        .update({ 
          reports_generated: user.reports_generated + 1,
          ip_address: ip 
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      setUser(data as AppUser);
      localStorage.setItem('solar_app_user', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error recording report generation:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('solar_app_user');
  };

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      canGenerateReport,
      remainingReports,
      registerUser,
      checkUserByEmail,
      recordReportGeneration,
      logout
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
