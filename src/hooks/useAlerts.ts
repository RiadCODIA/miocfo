import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Alert {
  id: string;
  type: string;
  title: string;
  message: string | null;
  severity: string;
  isRead: boolean;
  actionUrl: string | null;
  createdAt: string;
}

interface UseAlertsOptions {
  isRead?: boolean | null;
  severity?: string;
}

export function useAlerts(options: UseAlertsOptions = {}) {
  const { isRead = null, severity } = options;

  return useQuery({
    queryKey: ["alerts", { isRead, severity }],
    queryFn: async (): Promise<Alert[]> => {
      let query = supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (isRead !== null) {
        query = query.eq("is_read", isRead);
      }

      if (severity) {
        query = query.eq("severity", severity);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((alert) => ({
        id: alert.id,
        type: alert.type,
        title: alert.title,
        message: alert.message,
        severity: alert.severity ?? 'info',
        isRead: alert.is_read ?? false,
        actionUrl: alert.action_url,
        createdAt: alert.created_at,
      }));
    },
  });
}

export function useActiveAlertsCount() {
  return useQuery({
    queryKey: ["alerts-count"],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from("alerts")
        .select("id, severity", { count: "exact" })
        .eq("is_read", false);

      if (error) throw error;

      const highPriority = data?.filter(a => a.severity === "error").length || 0;

      return {
        total: count || 0,
        highPriority,
      };
    },
  });
}

export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-count"] });
    },
  });
}

export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      // Soft-delete: mark as read so the row stays for dedup checks
      const { error } = await supabase
        .from("alerts")
        .update({ is_read: true })
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-count"] });
    },
  });
}

export function useGenerateAlerts() {
  const queryClient = useQueryClient();
  const hasRun = useRef(false);

  const mutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase.functions.invoke("check-alerts", {
        body: { userId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-count"] });
    },
  });

  const generate = (userId: string | undefined) => {
    if (!userId || hasRun.current || mutation.isPending) return;
    hasRun.current = true;
    mutation.mutate(userId);
  };

  return { generate, isPending: mutation.isPending };
}
