import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

export interface GdprRequest {
  id: string;
  company_id: string | null;
  company_name: string | null;
  request_type: string;
  status: string;
  due_date: string;
  completed_at: string | null;
  created_at: string;
}

export interface IpAllowlistEntry {
  id: string;
  ip_address: string;
  description: string | null;
  created_at: string;
  created_by: string | null;
}

export interface SecurityPolicy {
  id: string;
  policy_type: string;
  settings: Json;
  updated_at: string;
  updated_by: string | null;
}

export function useGdprRequests() {
  return useQuery({
    queryKey: ["gdpr-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gdpr_requests")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as GdprRequest[];
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
      return data as IpAllowlistEntry[];
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
      return data as SecurityPolicy[];
    },
  });
}

export function useAddIpToAllowlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ip_address, description }: { ip_address: string; description?: string }) => {
      const { data, error } = await supabase
        .from("ip_allowlist")
        .insert({ ip_address, description })
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
    mutationFn: async ({ id, settings }: { id: string; settings: Json }) => {
      const { data, error } = await supabase
        .from("security_policies")
        .update({ settings })
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
    mutationFn: async ({ id, status, completed_at }: { id: string; status: string; completed_at?: string }) => {
      const { data, error } = await supabase
        .from("gdpr_requests")
        .update({ status, completed_at })
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
