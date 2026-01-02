import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface IntegrationProvider {
  id: string;
  name: string;
  provider_type: string;
  status: string;
  uptime: number;
  error_rate: number;
  rate_limit_hits: number;
  last_sync_at: string | null;
  config: Json;
  created_at: string;
  updated_at: string;
}

export interface SyncJob {
  id: string;
  company_id: string | null;
  provider_id: string | null;
  status: string;
  records_processed: number;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  stack_trace: string | null;
  created_at: string;
}

export function useIntegrationProviders() {
  return useQuery({
    queryKey: ["integration-providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("integration_providers")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as IntegrationProvider[];
    },
  });
}

export function useSyncJobs(limit = 20) {
  return useQuery({
    queryKey: ["sync-jobs", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sync_jobs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as SyncJob[];
    },
  });
}

type ProviderUpdate = Partial<Omit<IntegrationProvider, "config">> & { 
  id: string; 
  config?: Json;
};

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProviderUpdate) => {
      const { data, error } = await supabase
        .from("integration_providers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integration-providers"] });
      toast.success("Provider aggiornato con successo");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento del provider: " + error.message);
    },
  });
}

export function useCreateSyncJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (job: Omit<SyncJob, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("sync_jobs")
        .insert(job)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sync-jobs"] });
      toast.success("Sincronizzazione avviata");
    },
    onError: (error) => {
      toast.error("Errore nell'avvio della sincronizzazione: " + error.message);
    },
  });
}
