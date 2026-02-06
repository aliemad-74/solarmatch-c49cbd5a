import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminAuthContextType {
  admin: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  const checkAdminRole = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error("Error checking admin role:", error);
      return false;
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      setSession(currentSession);
      setAdmin(currentSession?.user ?? null);

      if (currentSession?.user) {
        // Check admin role using setTimeout to avoid race condition
        setTimeout(async () => {
          const hasAdminRole = await checkAdminRole(currentSession.user.id);
          setIsAdmin(hasAdminRole);
          setIsLoading(false);
        }, 0);
      } else {
        setIsAdmin(false);
        setIsLoading(false);
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setAdmin(existingSession?.user ?? null);

      if (existingSession?.user) {
        const hasAdminRole = await checkAdminRole(existingSession.user.id);
        setIsAdmin(hasAdminRole);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error: string | null }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        const hasAdminRole = await checkAdminRole(data.user.id);
        
        if (!hasAdminRole) {
          // Sign out if not admin
          await supabase.auth.signOut();
          setIsLoading(false);
          return { error: "You don't have admin privileges" };
        }

        setIsAdmin(true);
        setAdmin(data.user);
        setSession(data.session);
      }

      setIsLoading(false);
      return { error: null };
    } catch (error) {
      setIsLoading(false);
      return { error: "An unexpected error occurred" };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setAdmin(null);
      setSession(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  return (
    <AdminAuthContext.Provider value={{ admin, session, isLoading, isAdmin, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
};
