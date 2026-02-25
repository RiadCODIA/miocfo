import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

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

// Demo account credentials - used for demo login buttons
export const DEMO_ACCOUNTS = {
  user: { email: 'demo.user@miocfo.it', password: 'Demo2024!' },
  admin: { email: 'demo.admin@miocfo.it', password: 'Demo2024!' },
  superAdmin: { email: 'demo.superadmin@miocfo.it', password: 'Demo2024!' },
} as const;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemoMode: boolean;
  userRole: AppRole | null;
  permissions: AdminPermissions | null;
  superAdminPermissions: SuperAdminPermissions | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { first_name?: string; last_name?: string; company_name?: string; role?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  signInAsDemo: () => Promise<{ error: Error | null }>;
  signInAsDemoAdmin: () => Promise<{ error: Error | null }>;
  signInAsDemoSuperAdmin: () => Promise<{ error: Error | null }>;
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

// Check if the user is a demo account based on email
const isDemoEmail = (email: string | undefined): boolean => {
  if (!email) return false;
  return email === DEMO_ACCOUNTS.user.email || 
         email === DEMO_ACCOUNTS.admin.email || 
         email === DEMO_ACCOUNTS.superAdmin.email;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null);
  const [superAdminPermissions, setSuperAdminPermissions] = useState<SuperAdminPermissions | null>(null);

  // Derive isDemoMode from the user's email
  const isDemoMode = isDemoEmail(user?.email);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (!error && data) {
      const role = data.role as AppRole;
      setUserRole(role);
      
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
    } else {
      // Default to user role if no role found
      setUserRole('user');
      setPermissions(USER_PERMISSIONS);
      setSuperAdminPermissions(null);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Invalidate all React Query caches so data refetches with new auth
        queryClient.invalidateQueries();
        
        // Defer profile and role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRole(null);
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
      
      // Invalidate all React Query caches on session restore
      queryClient.invalidateQueries();
      
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
    await supabase.auth.signOut();
    setProfile(null);
    setUserRole(null);
    setPermissions(null);
    setSuperAdminPermissions(null);
  };

  // Demo login functions - now use real Supabase auth
  const signInAsDemo = async () => {
    return signIn(DEMO_ACCOUNTS.user.email, DEMO_ACCOUNTS.user.password);
  };

  const signInAsDemoAdmin = async () => {
    return signIn(DEMO_ACCOUNTS.admin.email, DEMO_ACCOUNTS.admin.password);
  };

  const signInAsDemoSuperAdmin = async () => {
    return signIn(DEMO_ACCOUNTS.superAdmin.email, DEMO_ACCOUNTS.superAdmin.password);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isDemoMode,
        userRole,
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
