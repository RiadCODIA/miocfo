import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface GlobalUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  role: 'user' | 'admin_aziendale' | 'super_admin';
  createdAt: string;
  lastSignIn: string | null;
}

export const useGlobalUsers = () => {
  return useQuery({
    queryKey: ['global-users'],
    queryFn: async () => {
      // Get profiles first (always works)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Try to get users with email via RPC (only works for real super_admin, not demo mode)
      let emailMap = new Map<string, { email: string; lastSignIn: string | null }>();
      
      try {
        const { data: usersWithEmail, error: rpcError } = await supabase
          .rpc('get_users_with_email');

        if (!rpcError && usersWithEmail) {
          usersWithEmail.forEach((u: { id: string; email: string; last_sign_in_at: string | null }) => {
            emailMap.set(u.id, { 
              email: u.email, 
              lastSignIn: u.last_sign_in_at 
            });
          });
        }
      } catch (e) {
        // RPC failed (expected in demo mode), continue without emails
        console.log('Email RPC not available (demo mode)');
      }

      // Map profiles with roles and emails
      const users: GlobalUser[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        const emailData = emailMap.get(profile.id);
        
        return {
          id: profile.id,
          email: emailData?.email || '(riservato)',
          firstName: profile.first_name,
          lastName: profile.last_name,
          companyName: profile.company_name,
          phone: profile.phone || null,
          role: userRole?.role || 'user',
          createdAt: profile.created_at,
          lastSignIn: emailData?.lastSignIn || null,
        };
      });

      return users;
    },
  });
};

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'user' | 'admin_aziendale' | 'super_admin' }) => {
      // First check if user has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['global-users'] });
      toast.success('Ruolo aggiornato con successo');
    },
    onError: (error) => {
      toast.error('Errore nell\'aggiornamento del ruolo', {
        description: error.message,
      });
    },
  });
};
