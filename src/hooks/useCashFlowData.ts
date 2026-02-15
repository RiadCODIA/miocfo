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
  breakEvenPoint: number;
  incidenzaCosti: number;
  incidenzaCostiChange: number;
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
      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", fromStr)
        .lte("date", toStr)
        .order("date", { ascending: true });

      if (error) throw error;

      // Build month keys spanning the selected range
      const monthlyMap = new Map<string, { incassi: number; pagamenti: number }>();
      const fromMonth = startOfMonth(dateRange.from);
      const toMonth = startOfMonth(dateRange.to);
      const numMonths = Math.max(differenceInMonths(toMonth, fromMonth) + 1, 1);

      for (let i = 0; i < numMonths; i++) {
        const monthDate = subMonths(toMonth, numMonths - 1 - i);
        const key = format(monthDate, "yyyy-MM");
        monthlyMap.set(key, { incassi: 0, pagamenti: 0 });
      }

      transactions?.forEach((t) => {
        const key = t.date.substring(0, 7);
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          if (t.amount > 0) current.incassi += t.amount;
          else current.pagamenti += Math.abs(t.amount);
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
      const { data: transactions, error: txError } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", fromStr)
        .lte("date", toStr)
        .order("date", { ascending: true });

      if (txError) throw txError;

      const { data: budgets, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("is_active", true);

      if (budgetError) throw budgetError;

      const fromMonth = startOfMonth(dateRange.from);
      const toMonth = startOfMonth(dateRange.to);
      const numMonths = Math.max(differenceInMonths(toMonth, fromMonth) + 1, 1);

      const monthlyMap = new Map<string, { incassi: number; pagamenti: number }>();
      for (let i = 0; i < numMonths; i++) {
        const monthDate = subMonths(toMonth, numMonths - 1 - i);
        const key = format(monthDate, "yyyy-MM");
        monthlyMap.set(key, { incassi: 0, pagamenti: 0 });
      }

      transactions?.forEach((t) => {
        const key = t.date.substring(0, 7);
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          if (t.amount > 0) current.incassi += t.amount;
          else current.pagamenti += Math.abs(t.amount);
        }
      });

      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;

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

export function useCashFlowKPIs() {
  const { dateRange } = useDateRange();
  const fromStr = dateRange.from.toISOString().split("T")[0];
  const toStr = dateRange.to.toISOString().split("T")[0];

  return useQuery({
    queryKey: ["cashflow-kpis", fromStr, toStr],
    queryFn: async (): Promise<CashFlowKPIs> => {
      // Get sum of all bank account balances for Cash Flow
      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance");

      const totalBalance = accounts?.reduce((sum, a) => sum + (Number(a.balance) || 0), 0) ?? 0;

      // Get transactions in selected range for other KPIs
      const { data: currentData } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", fromStr)
        .lte("date", toStr);

      let currentIncassi = 0;
      let currentPagamenti = 0;
      currentData?.forEach((t) => {
        if (t.amount > 0) currentIncassi += t.amount;
        else currentPagamenti += Math.abs(t.amount);
      });

      const currentCashflow = currentIncassi - currentPagamenti;
      const incidenzaCosti = currentIncassi > 0 ? (currentPagamenti / currentIncassi) * 100 : 0;
      const margineOperativo = currentIncassi > 0 ? (currentCashflow / currentIncassi) * 100 : 0;

      return {
        breakEvenPoint: currentPagamenti,
        incidenzaCosti: Math.round(incidenzaCosti * 10) / 10,
        incidenzaCostiChange: 0,
        cashflowCumulativo: totalBalance,
        cashflowChange: 0,
        margineOperativo: Math.round(margineOperativo * 10) / 10,
        margineOperativoChange: 0,
      };
    },
  });
}
