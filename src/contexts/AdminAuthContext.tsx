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
    let isMounted = true;

    const fetchAdminRole = async (userId: string) => {
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

    // Listener for ONGOING auth changes (does NOT control isLoading)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;
        setSession(currentSession);
        setAdmin(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Fire and forget for ongoing changes
          fetchAdminRole(currentSession.user.id).then((hasRole) => {
            if (isMounted) setIsAdmin(hasRole);
          });
        } else {
          setIsAdmin(false);
        }
      }
    );

    // INITIAL load (controls isLoading)
    const initializeAuth = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(existingSession);
        setAdmin(existingSession?.user ?? null);

        // Fetch role BEFORE setting loading false
        if (existingSession?.user) {
          const hasRole = await fetchAdminRole(existingSession.user.id);
          if (isMounted) setIsAdmin(hasRole);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
