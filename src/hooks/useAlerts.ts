import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Alert {
  id: string;
  type: "warning" | "info" | "success" | "error";
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

      return data?.map((alert) => ({
        id: alert.id,
        type: alert.type as Alert["type"],
        title: alert.title,
        message: alert.message,
        severity: alert.severity,
        isRead: alert.is_read,
        actionUrl: alert.action_url,
        createdAt: alert.created_at,
      })) || [];
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
      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-count"] });
    },
  });
}
