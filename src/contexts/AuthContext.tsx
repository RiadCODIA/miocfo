import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  avatar_url: string | null;
}

export type AppRole = 'user' | 'admin_aziendale';

interface AdminPermissions {
  can_view_clients: boolean;
  can_create_clients: boolean;
  can_view_client_kpi: boolean;
  can_view_client_cashflow: boolean;
  can_view_alerts: boolean;
  // User permissions
  can_manage_bank_accounts: boolean;
  can_manage_transactions: boolean;
  can_manage_invoices: boolean;
  can_manage_budget: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  demoRole: AppRole | null;
  permissions: AdminPermissions | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; company_name?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInAsDemo: () => void;
  signInAsDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_PERMISSIONS: AdminPermissions = {
  can_view_clients: false,
  can_create_clients: false,
  can_view_client_kpi: false,
  can_view_client_cashflow: false,
  can_view_alerts: true,
  can_manage_bank_accounts: true,
  can_manage_transactions: true,
  can_manage_invoices: true,
  can_manage_budget: true,
};

const ADMIN_PERMISSIONS: AdminPermissions = {
  can_view_clients: true,
  can_create_clients: true,
  can_view_client_kpi: true,
  can_view_client_cashflow: true,
  can_view_alerts: true,
  can_manage_bank_accounts: false,
  can_manage_transactions: false,
  can_manage_invoices: false,
  can_manage_budget: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string,
    password: string,
    metadata?: { first_name?: string; last_name?: string; company_name?: string }
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata,
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setDemoRole(null);
      setProfile(null);
      setPermissions(null);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
    setPermissions(null);
  };

  const signInAsDemo = () => {
    const demoProfile: Profile = {
      id: 'demo-user-id',
      first_name: 'Utente',
      last_name: 'Demo',
      company_name: 'Azienda Demo S.r.l.',
      avatar_url: null,
    };
    setProfile(demoProfile);
    setDemoRole('user');
    setPermissions(USER_PERMISSIONS);
    setIsDemoMode(true);
  };

  const signInAsDemoAdmin = () => {
    const adminDemoProfile: Profile = {
      id: 'demo-admin-id',
      first_name: 'Admin',
      last_name: 'Aziendale',
      company_name: 'Azienda Demo S.r.l.',
      avatar_url: null,
    };
    setProfile(adminDemoProfile);
    setDemoRole('admin_aziendale');
    setPermissions(ADMIN_PERMISSIONS);
    setIsDemoMode(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isDemoMode,
        demoRole,
        permissions,
        signIn,
        signUp,
        signOut,
        signInAsDemo,
        signInAsDemoAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
