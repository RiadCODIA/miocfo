import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { it } from "date-fns/locale";

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
  return useQuery({
    queryKey: ["cashflow-monthly"],
    queryFn: async (): Promise<MonthlyData[]> => {
      const now = new Date();
      const sixMonthsAgo = subMonths(startOfMonth(now), 5);

      const { data: transactions, error } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", sixMonthsAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;

      // Group by month
      const monthlyMap = new Map<string, { incassi: number; pagamenti: number }>();

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const key = format(monthDate, "yyyy-MM");
        monthlyMap.set(key, { incassi: 0, pagamenti: 0 });
      }

      // Aggregate transactions
      transactions?.forEach((t) => {
        const key = t.date.substring(0, 7); // yyyy-MM
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          if (t.amount > 0) {
            current.incassi += t.amount;
          } else {
            current.pagamenti += Math.abs(t.amount);
          }
        }
      });

      // Convert to array
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

// Hook per confronto con budget
export function useCashFlowVsBudget() {
  return useQuery({
    queryKey: ["cashflow-vs-budget"],
    queryFn: async () => {
      const now = new Date();
      const sixMonthsAgo = subMonths(startOfMonth(now), 5);

      // Get transactions grouped by month
      const { data: transactions, error: txError } = await supabase
        .from("bank_transactions")
        .select("amount, date")
        .gte("date", sixMonthsAgo.toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (txError) throw txError;

      // Get budgets
      const { data: budgets, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("is_active", true)
        .order("start_date", { ascending: true });

      if (budgetError) throw budgetError;

      // Group transactions by month
      const monthlyMap = new Map<string, { incassi: number; pagamenti: number }>();
      
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const key = format(monthDate, "yyyy-MM");
        monthlyMap.set(key, { incassi: 0, pagamenti: 0 });
      }

      transactions?.forEach((t) => {
        const key = t.date.substring(0, 7);
        if (monthlyMap.has(key)) {
          const current = monthlyMap.get(key)!;
          if (t.amount > 0) {
            current.incassi += t.amount;
          } else {
            current.pagamenti += Math.abs(t.amount);
          }
        }
      });

      // Build comparison data
      const result: { mese: string; consuntivo: number; previsionale: number }[] = [];
      
      // Calculate total budget amount for comparison
      const totalBudget = budgets?.reduce((sum, b) => sum + Number(b.amount), 0) || 0;
      
      monthlyMap.forEach((value, key) => {
        const [year, month] = key.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        const consuntivo = value.incassi - value.pagamenti;
        
        result.push({
          mese: format(date, "MMM", { locale: it }),
          consuntivo,
          previsionale: totalBudget / 6, // Simplified: distribute budget evenly
        });
      });

      return result;
    },
  });
}

export function useCashFlowKPIs() {
  return useQuery({
    queryKey: ["cashflow-kpis"],
    queryFn: async (): Promise<CashFlowKPIs> => {
      const now = new Date();
      const currentQuarterStart = subMonths(startOfMonth(now), 2);
      const previousQuarterStart = subMonths(currentQuarterStart, 3);
      const previousQuarterEnd = subMonths(currentQuarterStart, 1);
      const oneYearAgo = subMonths(now, 12);

      // Get current quarter transactions
      const { data: currentData } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", currentQuarterStart.toISOString().split("T")[0]);

      // Get previous quarter transactions
      const { data: previousData } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", previousQuarterStart.toISOString().split("T")[0])
        .lte("date", endOfMonth(previousQuarterEnd).toISOString().split("T")[0]);

      // Get last year transactions for cumulative comparison
      const { data: lastYearData } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", oneYearAgo.toISOString().split("T")[0])
        .lte("date", subMonths(now, 6).toISOString().split("T")[0]);

      // Calculate current quarter metrics
      let currentIncassi = 0;
      let currentPagamenti = 0;
      currentData?.forEach((t) => {
        if (t.amount > 0) currentIncassi += t.amount;
        else currentPagamenti += Math.abs(t.amount);
      });

      // Calculate previous quarter metrics
      let prevIncassi = 0;
      let prevPagamenti = 0;
      previousData?.forEach((t) => {
        if (t.amount > 0) prevIncassi += t.amount;
        else prevPagamenti += Math.abs(t.amount);
      });

      // Calculate last year metrics
      let lastYearCashflow = 0;
      lastYearData?.forEach((t) => {
        lastYearCashflow += t.amount;
      });

      const currentCashflow = currentIncassi - currentPagamenti;
      const prevCashflow = prevIncassi - prevPagamenti;

      // Incidenza costi = pagamenti / incassi * 100
      const incidenzaCosti = currentIncassi > 0 ? (currentPagamenti / currentIncassi) * 100 : 0;
      const prevIncidenza = prevIncassi > 0 ? (prevPagamenti / prevIncassi) * 100 : 0;

      // Margine operativo = (incassi - pagamenti) / incassi * 100
      const margineOperativo = currentIncassi > 0 ? (currentCashflow / currentIncassi) * 100 : 0;
      const prevMargine = prevIncassi > 0 ? (prevCashflow / prevIncassi) * 100 : 0;

      // Cashflow cumulativo (ultimi 6 mesi)
      const { data: cumulativeData } = await supabase
        .from("bank_transactions")
        .select("amount")
        .gte("date", subMonths(now, 6).toISOString().split("T")[0]);

      let cashflowCumulativo = 0;
      cumulativeData?.forEach((t) => {
        cashflowCumulativo += t.amount;
      });

      // Cashflow change vs anno precedente
      const cashflowChange = lastYearCashflow !== 0 
        ? ((cashflowCumulativo - lastYearCashflow) / Math.abs(lastYearCashflow)) * 100 
        : 0;

      return {
        breakEvenPoint: currentPagamenti > 0 ? currentPagamenti : 0,
        incidenzaCosti: Math.round(incidenzaCosti * 10) / 10,
        incidenzaCostiChange: Math.round((incidenzaCosti - prevIncidenza) * 10) / 10,
        cashflowCumulativo,
        cashflowChange: Math.round(cashflowChange * 10) / 10,
        margineOperativo: Math.round(margineOperativo * 10) / 10,
        margineOperativoChange: Math.round((margineOperativo - prevMargine) * 10) / 10,
      };
    },
  });
}
