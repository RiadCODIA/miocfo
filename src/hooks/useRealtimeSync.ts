import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to Supabase realtime changes on key tables
 * and automatically invalidates related React Query caches.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bank_accounts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["bank-accounts-balances"] });
          queryClient.invalidateQueries({ queryKey: ["connected-accounts-count"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
          queryClient.invalidateQueries({ queryKey: ["liquidity-chart"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bank_transactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-kpis"] });
          queryClient.invalidateQueries({ queryKey: ["category-analysis"] });
          queryClient.invalidateQueries({ queryKey: ["liquidity-chart"] });
          queryClient.invalidateQueries({ queryKey: ["income-expense-chart"] });
          queryClient.invalidateQueries({ queryKey: ["transactions"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["invoices"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "deadlines" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["deadlines"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budgets" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["budgets"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["alerts"] });
          queryClient.invalidateQueries({ queryKey: ["unread-alerts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
