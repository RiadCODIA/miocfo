import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export interface AdminClient {
  id: string;
  admin_id: string;
  client_id: string;
  created_at: string;
  company: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    vat_number: string | null;
    status: string;
    revenue: number;
    cashflow: number;
    alerts_count: number;
    user_id: string | null;
    created_at: string;
  };
  profile?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  };
}

export interface CreateClientUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phone?: string;
  vatNumber?: string;
}

export function useAdminClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["admin-clients", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch admin_clients with company data
      const { data: adminClients, error } = await supabase
        .from("admin_clients")
        .select(`
          id,
          admin_id,
          client_id,
          created_at,
          company:companies!admin_clients_client_id_fkey(
            id,
            name,
            email,
            phone,
            vat_number,
            status,
            revenue,
            cashflow,
            alerts_count,
            user_id,
            created_at
          )
        `)
        .eq("admin_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for users that have user_id
      const userIds = adminClients
        ?.map((ac: any) => ac.company?.user_id)
        .filter(Boolean) || [];

      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", userIds);
        profiles = profilesData || [];
      }

      // Combine data
      return (adminClients || []).map((ac: any) => ({
        ...ac,
        company: ac.company,
        profile: profiles.find((p: any) => p.id === ac.company?.user_id)
      })) as AdminClient[];
    },
    enabled: !!user,
  });
}

export function useCreateClientUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClientUserData) => {
      const { data: response, error } = await supabase.functions.invoke('create-client-user', {
        body: data
      });

      if (error) throw error;
      if (response?.error) throw new Error(response.error);
      
      return response;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success(`Cliente "${data.data.companyName}" creato con successo!`);
    },
    onError: (error: Error) => {
      toast.error(`Errore nella creazione del cliente: ${error.message}`);
    },
  });
}

export function useDeleteAdminClient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (clientId: string) => {
      // Delete the admin_client link (company and user remain)
      const { error } = await supabase
        .from("admin_clients")
        .delete()
        .eq("client_id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      queryClient.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Cliente rimosso dalla gestione");
    },
    onError: (error: Error) => {
      toast.error(`Errore: ${error.message}`);
    },
  });
}
