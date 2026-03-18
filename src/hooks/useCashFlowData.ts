import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth, differenceInMonths } from "date-fns";
import { it } from "date-fns/locale";
import { useDateRange } from "@/contexts/DateRangeContext";

interface MonthlyData {
  mese: string;
  meseShort: string;
  monthKey: string;
  incassi: number;
  pagamenti: number;
  utile: number;
  cashflow: number;
}

interface CashFlowKPIs {
  totaleIncassi: number;
  totalePagamenti: number;
  cashflowCumulativo: number;
  cashflowChange: number;
  margineOperativo: number;
  margineOperativoChange: number;
}

export function useCashFlowData() {
  const { dateRange } = useDateRange();
  const fromStr = dateRange.from.toISOString().split("T")[0];
  const toStr = dateRange.to.toISOString().split("T")[0];

  return useQuery({
    queryKey: ["cashflow-monthly", fromStr, toStr],
    queryFn: async (): Promise<MonthlyData[]> => {
      const { data: rpcData, error } = await supabase
        .rpc("get_cashflow_summary", { p_from: fromStr, p_to: toStr });

      if (error) throw error;

      // Build month keys spanning the selected range (so empty months appear)
      const monthlyMap = new Map<string, { incassi: number; pagamenti: number }>();
      const fromMonth = startOfMonth(dateRange.from);
      const toMonth = startOfMonth(dateRange.to);
      const numMonths = Math.max(differenceInMonths(toMonth, fromMonth) + 1, 1);

      for (let i = 0; i < numMonths; i++) {
        const monthDate = subMonths(toMonth, numMonths - 1 - i);
        const key = format(monthDate, "yyyy-MM");
        monthlyMap.set(key, { incassi: 0, pagamenti: 0 });
      }

      // Merge RPC results
      (rpcData || []).forEach((row: any) => {
        const key = row.month_key;
        if (monthlyMap.has(key)) {
          monthlyMap.set(key, {
            incassi: Number(row.incassi),
            pagamenti: Number(row.pagamenti),
          });
        }
      });

      const result: MonthlyData[] = [];
      monthlyMap.forEach((value, key) => {
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const utile = value.incassi - value.pagamenti;
        result.push({
          mese: format(date, "MMMM yyyy", { locale: it }),
          meseShort: format(date, "MMM", { locale: it }),
          monthKey: key,
          incassi: value.incassi,
          pagamenti: value.pagamenti,
          utile,
          cashflow: utile,
        });
      });

      return result;
    },
  });
}

export function useCashFlowVsBudget() {
  const { dateRange } = useDateRange();
  const fromStr = dateRange.from.toISOString().split("T")[0];
  const toStr = dateRange.to.toISOString().split("T")[0];

  return useQuery({
    queryKey: ["cashflow-vs-budget", fromStr, toStr],
    queryFn: async () => {
      const [rpcRes, budgetRes] = await Promise.all([
        supabase.rpc("get_cashflow_summary", { p_from: fromStr, p_to: toStr }),
        supabase.from("budgets").select("*").eq("is_active", true),
      ]);

      if (rpcRes.error) throw rpcRes.error;
      if (budgetRes.error) throw budgetRes.error;

      const fromMonth = startOfMonth(dateRange.from);
      const toMonth = startOfMonth(dateRange.to);
      const numMonths = Math.max(differenceInMonths(toMonth, fromMonth) + 1, 1);

      const monthlyMap = new Map<string, { incassi: number; pagamenti: number }>();
      for (let i = 0; i < numMonths; i++) {
        const monthDate = subMonths(toMonth, numMonths - 1 - i);
        const key = format(monthDate, "yyyy-MM");
        monthlyMap.set(key, { incassi: 0, pagamenti: 0 });
      }

      (rpcRes.data || []).forEach((row: any) => {
        if (monthlyMap.has(row.month_key)) {
          monthlyMap.set(row.month_key, {
            incassi: Number(row.incassi),
            pagamenti: Number(row.pagamenti),
          });
        }
      });

      const totalBudget = budgetRes.data?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

      const result: { mese: string; consuntivo: number; previsionale: number }[] = [];
      monthlyMap.forEach((value, key) => {
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        result.push({
          mese: format(date, "MMM", { locale: it }),
          consuntivo: value.incassi - value.pagamenti,
          previsionale: totalBudget / Math.max(numMonths, 1),
        });
      });

      return result;
    },
  });
}

interface CompositionCategory {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

const COMPOSITION_CATEGORIES = [
  { name: "Incassi Fatture", color: "hsl(var(--primary))", patterns: [/fattura/i, /pagamento/i, /invoice/i, /payment from/i, /saldo fatt/i, /pag\.?\s*fatt/i] },
  { name: "Prestiti e Finanziamenti", color: "hsl(var(--accent))", patterns: [/prestito/i, /finanziamento/i, /loan/i, /mutuo/i, /fido/i, /credito/i] },
  { name: "Trasferimenti e Versamenti", color: "hsl(210, 70%, 55%)", patterns: [/top.?up/i, /trasferimento/i, /bonifico/i, /transfer/i, /giroconto/i] },
  { name: "Versamenti Contanti", color: "hsl(45, 80%, 50%)", patterns: [/contanti/i, /cash/i, /deposito/i, /versamento/i] },
  { name: "Rimborsi", color: "hsl(280, 60%, 55%)", patterns: [/rimborso/i, /refund/i, /reso/i, /storno/i] },
  { name: "Altro", color: "hsl(var(--muted-foreground))", patterns: [] },
];

function classifyTransaction(description: string | null): string {
  if (!description) return "Altro";
  for (const cat of COMPOSITION_CATEGORIES) {
    if (cat.name === "Altro") continue;
    if (cat.patterns.some((p) => p.test(description))) return cat.name;
  }
  return "Altro";
}

// Helper: paginated fetch to get ALL rows (bypasses 1000-row limit)
async function fetchAllPositiveTransactions(fromStr: string, toStr: string) {
  const PAGE_SIZE = 1000;
  let allRows: { amount: number; description: string | null }[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("bank_transactions")
      .select("amount, description")
      .gt("amount", 0)
      .gte("date", fromStr)
      .lte("date", toStr)
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw error;
    if (data) allRows = allRows.concat(data);
    hasMore = (data?.length || 0) === PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  return allRows;
}

export function useCashFlowComposition() {
  const { dateRange } = useDateRange();
  const fromStr = dateRange.from.toISOString().split("T")[0];
  const toStr = dateRange.to.toISOString().split("T")[0];

  return useQuery({
    queryKey: ["cashflow-composition", fromStr, toStr],
    queryFn: async (): Promise<CompositionCategory[]> => {
      const transactions = await fetchAllPositiveTransactions(fromStr, toStr);

      const totals = new Map<string, number>();
      COMPOSITION_CATEGORIES.forEach((c) => totals.set(c.name, 0));

      transactions.forEach((t) => {
        const cat = classifyTransaction(t.description);
        totals.set(cat, (totals.get(cat) || 0) + Number(t.amount));
      });

      const grandTotal = Array.from(totals.values()).reduce((s, v) => s + v, 0);

      return COMPOSITION_CATEGORIES
        .map((c) => ({
          name: c.name,
          value: totals.get(c.name) || 0,
          percentage: grandTotal > 0 ? Math.round(((totals.get(c.name) || 0) / grandTotal) * 1000) / 10 : 0,
          color: c.color,
        }))
        .filter((c) => c.value > 0);
    },
  });
}

export function useCashFlowKPIs() {
  const { dateRange } = useDateRange();
  const fromStr = dateRange.from.toISOString().split("T")[0];
  const toStr = dateRange.to.toISOString().split("T")[0];

  return useQuery({
    queryKey: ["cashflow-kpis", fromStr, toStr],
    queryFn: async (): Promise<CashFlowKPIs> => {
      const [accountsRes, totalsRes] = await Promise.all([
        supabase.from("bank_accounts").select("balance"),
        supabase.rpc("get_cashflow_totals", { p_from: fromStr, p_to: toStr }),
      ]);

      const totalBalance = accountsRes.data?.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) ?? 0;

      const row = totalsRes.data?.[0] || { total_income: 0, total_expenses: 0 };
      const currentIncassi = Number(row.total_income);
      const currentPagamenti = Number(row.total_expenses);
      const currentCashflow = currentIncassi - currentPagamenti;
      const margineOperativo = currentIncassi > 0 ? (currentCashflow / currentIncassi) * 100 : 0;

      return {
        totaleIncassi: currentIncassi,
        totalePagamenti: currentPagamenti,
        cashflowCumulativo: totalBalance,
        cashflowChange: 0,
        margineOperativo: Math.round(margineOperativo * 10) / 10,
        margineOperativoChange: 0,
      };
    },
  });
}
