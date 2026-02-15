import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribes to Supabase realtime changes on ALL key tables
 * and automatically invalidates related React Query caches.
 * Uses debouncing to avoid redundant re-fetches during batch operations.
 */
export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const invalidate = useCallback(
    (keys: string[]) => {
      // Debounce: group invalidations within 300ms
      const cacheKey = keys.sort().join("|");
      if (debounceTimers.current[cacheKey]) {
        clearTimeout(debounceTimers.current[cacheKey]);
      }
      debounceTimers.current[cacheKey] = setTimeout(() => {
        keys.forEach((key) => {
          queryClient.invalidateQueries({ queryKey: [key] });
        });
        delete debounceTimers.current[cacheKey];
      }, 300);
    },
    [queryClient]
  );

  useEffect(() => {
    const channel = supabase
      .channel("realtime-sync")
      // ── bank_accounts ──
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_accounts" }, () => {
        invalidate([
          "bank-accounts-balances",
          "bank-accounts-list",
          "bank-accounts",
          "connected-accounts-count",
          "dashboard-kpis",
          "liquidity-chart",
          "cash-flow-data",
          "liquidity-forecast",
        ]);
      })
      // ── bank_transactions ──
      .on("postgres_changes", { event: "*", schema: "public", table: "bank_transactions" }, () => {
        invalidate([
          "dashboard-kpis",
          "category-analysis",
          "liquidity-chart",
          "income-expense-chart",
          "transactions",
          "cash-flow-data",
          "cash-flow-kpis",
          "cash-flow-vs-budget",
          "budget-comparison",
          "budget-variance-summary",
          "contoeconomico",
          "product-margins",
          "liquidity-forecast",
          "deadlines-summary",
          "spending-analysis",
        ]);
      })
      // ── invoices ──
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, () => {
        invalidate([
          "invoices",
          "invoices-for-deadlines",
          "deadlines",
          "deadlines-summary",
          "liquidity-forecast",
          "dashboard-kpis",
        ]);
      })
      // ── deadlines ──
      .on("postgres_changes", { event: "*", schema: "public", table: "deadlines" }, () => {
        invalidate([
          "deadlines",
          "deadlines-summary",
          "liquidity-forecast",
        ]);
      })
      // ── budgets ──
      .on("postgres_changes", { event: "*", schema: "public", table: "budgets" }, () => {
        invalidate([
          "budgets",
          "budget-comparison",
          "budget-variance-summary",
          "cash-flow-vs-budget",
        ]);
      })
      // ── alerts ──
      .on("postgres_changes", { event: "*", schema: "public", table: "alerts" }, () => {
        invalidate([
          "alerts",
          "alerts-count",
        ]);
      })
      // ── profiles ──
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        invalidate(["profile"]);
      })
      // ── employees ──
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, () => {
        invalidate(["employees"]);
      })
      // ── cost_categories ──
      .on("postgres_changes", { event: "*", schema: "public", table: "cost_categories" }, () => {
        invalidate(["cost-categories", "category-analysis"]);
      })
      // ── revenue_centers ──
      .on("postgres_changes", { event: "*", schema: "public", table: "revenue_centers" }, () => {
        invalidate(["revenue-centers"]);
      })
      // ── vat_rates ──
      .on("postgres_changes", { event: "*", schema: "public", table: "vat_rates" }, () => {
        invalidate(["vat-rates"]);
      })
      // ── notification_preferences ──
      .on("postgres_changes", { event: "*", schema: "public", table: "notification_preferences" }, () => {
        invalidate(["notification-preferences"]);
      })
      // ── categorization_rules ──
      .on("postgres_changes", { event: "*", schema: "public", table: "categorization_rules" }, () => {
        invalidate(["categorization-rules"]);
      })
      // ── companies ──
      .on("postgres_changes", { event: "*", schema: "public", table: "companies" }, () => {
        invalidate(["companies", "admin-clients"]);
      })
      // ── company_financials ──
      .on("postgres_changes", { event: "*", schema: "public", table: "company_financials" }, () => {
        invalidate([
          "company-financials",
          "all-company-financials",
          "company-kpis",
          "aggregated-kpis",
        ]);
      })
      .subscribe();

    return () => {
      // Clear all pending debounce timers
      Object.values(debounceTimers.current).forEach(clearTimeout);
      debounceTimers.current = {};
      supabase.removeChannel(channel);
    };
  }, [invalidate]);
}
