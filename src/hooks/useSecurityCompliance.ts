import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface GdprRequest {
  id: string;
  userId: string | null;
  requestType: string;
  status: string;
  notes: string | null;
  requestedAt: string;
  processedAt: string | null;
}

export interface IpAllowlistEntry {
  id: string;
  ipAddress: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface SecurityPolicy {
  id: string;
  name: string;
  policyType: string;
  config: Json;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function useGdprRequests() {
  return useQuery({
    queryKey: ["gdpr-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gdpr_requests")
        .select("*")
        .order("requested_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(req => ({
        id: req.id,
        userId: req.user_id,
        requestType: req.request_type,
        status: req.status ?? 'pending',
        notes: req.notes,
        requestedAt: req.requested_at,
        processedAt: req.processed_at,
      })) as GdprRequest[];
    },
  });
}

export function useIpAllowlist() {
  return useQuery({
    queryKey: ["ip-allowlist"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ip_allowlist")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(entry => ({
        id: entry.id,
        ipAddress: String(entry.ip_address),
        description: entry.description,
        isActive: entry.is_active ?? true,
        createdAt: entry.created_at,
      })) as IpAllowlistEntry[];
    },
  });
}

export function useSecurityPolicies() {
  return useQuery({
    queryKey: ["security-policies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("security_policies")
        .select("*");

      if (error) throw error;
      
      return (data || []).map(policy => ({
        id: policy.id,
        name: policy.name,
        policyType: policy.policy_type,
        config: policy.config,
        isActive: policy.is_active ?? true,
        createdAt: policy.created_at,
        updatedAt: policy.updated_at,
      })) as SecurityPolicy[];
    },
  });
}

export function useAddIpToAllowlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ip_address, description }: { ip_address: string; description?: string }) => {
      const { data, error } = await supabase
        .from("ip_allowlist")
        .insert({ ip_address: ip_address as unknown as string, description })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-allowlist"] });
      toast.success("IP aggiunto alla allowlist");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiunta dell'IP: " + error.message);
    },
  });
}

export function useRemoveIpFromAllowlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("ip_allowlist")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ip-allowlist"] });
      toast.success("IP rimosso dalla allowlist");
    },
    onError: (error) => {
      toast.error("Errore nella rimozione dell'IP: " + error.message);
    },
  });
}

export function useUpdateSecurityPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, config }: { id: string; config: Json }) => {
      const { data, error } = await supabase
        .from("security_policies")
        .update({ config })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["security-policies"] });
      toast.success("Policy aggiornata con successo");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento della policy: " + error.message);
    },
  });
}

export function useUpdateGdprRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, processed_at }: { id: string; status: string; processed_at?: string }) => {
      const { data, error } = await supabase
        .from("gdpr_requests")
        .update({ status, processed_at })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gdpr-requests"] });
      toast.success("Richiesta GDPR aggiornata");
    },
    onError: (error) => {
      toast.error("Errore nell'aggiornamento della richiesta: " + error.message);
    },
  });
}
