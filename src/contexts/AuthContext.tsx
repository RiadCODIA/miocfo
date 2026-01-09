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

export type AppRole = 'user' | 'admin_aziendale' | 'super_admin';

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

interface SuperAdminPermissions {
  can_view_all_companies: boolean;
  can_manage_all_users: boolean;
  can_manage_plans: boolean;
  can_manage_integrations: boolean;
  can_access_logs: boolean;
  can_manage_security: boolean;
  can_manage_global_settings: boolean;
  can_access_financial_data_operatively: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  demoRole: AppRole | null;
  permissions: AdminPermissions | null;
  superAdminPermissions: SuperAdminPermissions | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; company_name?: string; role?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInAsDemo: () => void;
  signInAsDemoAdmin: () => void;
  signInAsDemoSuperAdmin: () => void;
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

const SUPER_ADMIN_PERMISSIONS: SuperAdminPermissions = {
  can_view_all_companies: true,
  can_manage_all_users: true,
  can_manage_plans: true,
  can_manage_integrations: true,
  can_access_logs: true,
  can_manage_security: true,
  can_manage_global_settings: true,
  can_access_financial_data_operatively: false,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoRole, setDemoRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [superAdminPermissions, setSuperAdminPermissions] = useState<SuperAdminPermissions | null>(null);

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

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();
    
    if (!error && data) {
      const role = data.role as AppRole;
      if (role === 'admin_aziendale') {
        setPermissions(ADMIN_PERMISSIONS);
        setSuperAdminPermissions(null);
      } else if (role === 'super_admin') {
        setPermissions(null);
        setSuperAdminPermissions(SUPER_ADMIN_PERMISSIONS);
      } else {
        setPermissions(USER_PERMISSIONS);
        setSuperAdminPermissions(null);
      }
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile and role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setPermissions(null);
          setSuperAdminPermissions(null);
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
        fetchUserRole(session.user.id);
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
    metadata?: { first_name?: string; last_name?: string; company_name?: string; role?: string }
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
      setSuperAdminPermissions(null);
      return;
    }
    await supabase.auth.signOut();
    setProfile(null);
    setPermissions(null);
    setSuperAdminPermissions(null);
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
    setSuperAdminPermissions(null);
    setIsDemoMode(true);
  };

  const signInAsDemoSuperAdmin = () => {
    const superAdminDemoProfile: Profile = {
      id: 'demo-super-admin-id',
      first_name: 'Super',
      last_name: 'Admin',
      company_name: 'Finexa Platform',
      avatar_url: null,
    };
    setProfile(superAdminDemoProfile);
    setDemoRole('super_admin');
    setPermissions(null);
    setSuperAdminPermissions(SUPER_ADMIN_PERMISSIONS);
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
        superAdminPermissions,
        signIn,
        signUp,
        signOut,
        signInAsDemo,
        signInAsDemoAdmin,
        signInAsDemoSuperAdmin,
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
