import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ApplicationLog {
  id: string;
  level: string;
  service: string;
  message: string;
  request_id: string | null;
  company_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AuditTrailEntry {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  result: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface LogFilters {
  level?: string;
  service?: string;
  company_id?: string;
  request_id?: string;
}

export function useApplicationLogs(filters: LogFilters = {}, limit = 100) {
  return useQuery({
    queryKey: ["application-logs", filters, limit],
    queryFn: async () => {
      let query = supabase
        .from("application_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (filters.level) {
        query = query.eq("level", filters.level);
      }
      if (filters.service) {
        query = query.eq("service", filters.service);
      }
      if (filters.company_id) {
        query = query.eq("company_id", filters.company_id);
      }
      if (filters.request_id) {
        query = query.eq("request_id", filters.request_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ApplicationLog[];
    },
  });
}

export function useAuditTrail(limit = 50) {
  return useQuery({
    queryKey: ["audit-trail", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_trail")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AuditTrailEntry[];
    },
  });
}
