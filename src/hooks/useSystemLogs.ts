import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export interface ApplicationLog {
  id: string;
  level: string;
  source: string | null;
  message: string;
  userId: string | null;
  metadata: Json;
  createdAt: string;
}

export interface AuditTrailEntry {
  id: string;
  userId: string | null;
  action: string;
  tableName: string | null;
  recordId: string | null;
  oldValues: Json;
  newValues: Json;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface LogFilters {
  level?: string;
  source?: string;
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
      if (filters.source) {
        query = query.eq("source", filters.source);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map(log => ({
        id: log.id,
        level: log.level,
        source: log.source,
        message: log.message,
        userId: log.user_id,
        metadata: log.metadata,
        createdAt: log.created_at,
      })) as ApplicationLog[];
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
      
      return (data || []).map(entry => ({
        id: entry.id,
        userId: entry.user_id,
        action: entry.action,
        tableName: entry.table_name,
        recordId: entry.record_id,
        oldValues: entry.old_values,
        newValues: entry.new_values,
        ipAddress: entry.ip_address ? String(entry.ip_address) : null,
        userAgent: entry.user_agent,
        createdAt: entry.created_at,
      })) as AuditTrailEntry[];
    },
  });
}
