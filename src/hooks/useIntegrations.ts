import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface IntegrationProvider {
  id: string;
  name: string;
  type: string;
  description: string | null;
  isActive: boolean;
  config: Json;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJob {
  id: string;
  userId: string | null;
  jobType: string;
  provider: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
  metadata: Json;
  createdAt: string;
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
      
      return (data || []).map(provider => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        description: provider.description,
        isActive: provider.is_active ?? true,
        config: provider.config,
        createdAt: provider.created_at,
        updatedAt: provider.updated_at,
      })) as IntegrationProvider[];
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
      
      return (data || []).map(job => ({
        id: job.id,
        userId: job.user_id,
        jobType: job.job_type,
        provider: job.provider,
        status: job.status ?? 'pending',
        startedAt: job.started_at,
        completedAt: job.completed_at,
        errorMessage: job.error_message,
        metadata: job.metadata,
        createdAt: job.created_at,
      })) as SyncJob[];
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<IntegrationProvider> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.config !== undefined) updateData.config = updates.config;

      const { data, error } = await supabase
        .from("integration_providers")
        .update(updateData)
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
    mutationFn: async (job: { jobType: string; provider: string; userId?: string; metadata?: Json }) => {
      const { data, error } = await supabase
        .from("sync_jobs")
        .insert({
          job_type: job.jobType,
          provider: job.provider,
          user_id: job.userId,
          metadata: job.metadata,
          status: 'pending',
        })
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
