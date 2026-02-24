import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, differenceInDays } from "date-fns";
import { useDateRange } from "@/contexts/DateRangeContext";

interface KPIData {
  id: string;
  nome: string;
  valore: string;
  target: string;
  raggiunto: boolean;
  trend: string;
  categoria: "standard" | "personalizzato";
  progressValue: number;
  rawValue: number;
  rawTarget: number;
}

interface ReportData {
  id: string;
  nome: string;
  tipo: string;
  dataCreazione: string;
  stato: "completato" | "in elaborazione" | "programmato";
}

const DEFAULT_TARGETS: Record<string, number> = {
  ros: 10,
  dso: 45,
  current_ratio: 1.5,
  margine_operativo: 28,
  burn_rate: 60000,
  revenue_growth: 10,
};

export function useKPITargets() {
  return useQuery({
    queryKey: ["kpi-targets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kpi_targets")
        .select("kpi_id, target_value");
      const map: Record<string, number> = { ...DEFAULT_TARGETS };
      data?.forEach((row: any) => {
        map[row.kpi_id] = Number(row.target_value);
      });
      return map;
    },
  });
}

export function useUpdateKPITargets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (targets: Record<string, number>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non autenticato");
      
      const rows = Object.entries(targets).map(([kpi_id, target_value]) => ({
        user_id: user.id,
        kpi_id,
        target_value,
      }));

      for (const row of rows) {
        const { error } = await supabase
          .from("kpi_targets")
          .upsert(row, { onConflict: "user_id,kpi_id" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kpi-targets"] });
      qc.invalidateQueries({ queryKey: ["kpi-data"] });
    },
  });
}

export function useKPIData() {
  const { data: targets } = useKPITargets();
  const { dateRange } = useDateRange();
  const from = format(dateRange.from, "yyyy-MM-dd");
  const to = format(dateRange.to, "yyyy-MM-dd");

  // Previous period of same length
  const periodDays = differenceInDays(dateRange.to, dateRange.from);
  const prevFrom = format(subDays(dateRange.from, periodDays + 1), "yyyy-MM-dd");
  const prevTo = format(subDays(dateRange.from, 1), "yyyy-MM-dd");

  return useQuery({
    queryKey: ["kpi-data", targets, from, to],
    enabled: !!targets,
    queryFn: async () => {
      const t = targets || DEFAULT_TARGETS;
      const now = new Date();

      // Get transactions for current period
      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("*")
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false });

      // Get transactions for previous period
      const { data: prevTransactions } = await supabase
        .from("bank_transactions")
        .select("*")
        .gte("date", prevFrom)
        .lte("date", prevTo);

      // Get bank accounts for balance
      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("is_connected", true);

      // Get invoices for ROS and DSO
      const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .gte("invoice_date", from)
        .lte("invoice_date", to);

      const { data: prevInvoices } = await supabase
        .from("invoices")
        .select("*")
        .gte("invoice_date", prevFrom)
        .lte("invoice_date", prevTo);

      // Get deadlines for receivables
      const { data: deadlines } = await supabase
        .from("deadlines")
        .select("*")
        .eq("deadline_type", "incasso")
        .eq("status", "pending");

      const currentBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      // Current period
      const currentIncome = (transactions || []).filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      const currentExpenses = Math.abs((transactions || []).filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      const currentProfit = currentIncome - currentExpenses;

      // Previous period
      const prevIncome = (prevTransactions || []).filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      const prevExpensesVal = Math.abs((prevTransactions || []).filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      const prevProfit = prevIncome - prevExpensesVal;

      // ---- ROS (Return on Sales) from invoices ----
      const ricaviCurrent = (invoices || [])
        .filter(inv => inv.invoice_type === "emessa" || inv.invoice_type === "income")
        .reduce((s, inv) => s + Number(inv.amount), 0);
      const costiCurrent = (invoices || [])
        .filter(inv => inv.invoice_type === "ricevuta" || inv.invoice_type === "expense")
        .reduce((s, inv) => s + Number(inv.amount), 0);
      const ebitdaCurrent = ricaviCurrent - costiCurrent;
      const ros = ricaviCurrent > 0 ? (ebitdaCurrent / ricaviCurrent) * 100 : 0;

      const ricaviLast = (prevInvoices || [])
        .filter(inv => inv.invoice_type === "emessa" || inv.invoice_type === "income")
        .reduce((s, inv) => s + Number(inv.amount), 0);
      const costiLast = (prevInvoices || [])
        .filter(inv => inv.invoice_type === "ricevuta" || inv.invoice_type === "expense")
        .reduce((s, inv) => s + Number(inv.amount), 0);
      const ebitdaLast = ricaviLast - costiLast;
      const rosLast = ricaviLast > 0 ? (ebitdaLast / ricaviLast) * 100 : 0;
      const rosTrend = ros - rosLast;
      const rosTarget = t.ros;

      // DSO
      const pendingReceivables = deadlines?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const avgDailyRevenue = currentIncome / (periodDays || 1) || 1;
      const dso = Math.round(pendingReceivables / avgDailyRevenue);
      const dsoTarget = t.dso;

      // Current Ratio
      const currentLiabilities = currentExpenses || 1;
      const currentRatio = currentBalance / currentLiabilities;
      const currentRatioTarget = t.current_ratio;

      // Operating Margin
      const operatingMargin = currentIncome > 0 ? ((currentProfit / currentIncome) * 100) : 0;
      const lastOperatingMargin = prevIncome > 0 ? ((prevProfit / prevIncome) * 100) : 0;
      const operatingMarginTarget = t.margine_operativo;
      const operatingMarginTrend = operatingMargin - lastOperatingMargin;

      // Burn Rate
      const burnRate = currentExpenses;
      const lastBurnRate = prevExpensesVal;
      const burnRateTarget = t.burn_rate;
      const burnRateTrend = burnRate - lastBurnRate;

      // Revenue Growth
      const revenueGrowth = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome * 100) : 0;
      const revenueGrowthTarget = t.revenue_growth;

      const kpis: KPIData[] = [
        {
          id: "ros",
          nome: "ROS (Return on Sales)",
          valore: `${ros.toFixed(1)}%`,
          target: `${rosTarget}%`,
          raggiunto: ros >= rosTarget,
          trend: `${rosTrend >= 0 ? "+" : ""}${rosTrend.toFixed(1)}%`,
          categoria: "standard",
          progressValue: Math.min((ros / (rosTarget || 1)) * 100, 100),
          rawValue: ros,
          rawTarget: rosTarget,
        },
        {
          id: "dso",
          nome: "DSO (Days Sales Outstanding)",
          valore: `${dso} giorni`,
          target: `${dsoTarget} giorni`,
          raggiunto: dso <= dsoTarget,
          trend: `${dso <= dsoTarget ? "-" : "+"}${Math.abs(dso - dsoTarget)} giorni`,
          categoria: "standard",
          progressValue: dso <= dsoTarget ? 100 : Math.max(0, 100 - ((dso - dsoTarget) / dsoTarget) * 100),
          rawValue: dso,
          rawTarget: dsoTarget,
        },
        {
          id: "current_ratio",
          nome: "Current Ratio",
          valore: currentRatio.toFixed(1),
          target: currentRatioTarget.toString(),
          raggiunto: currentRatio >= currentRatioTarget,
          trend: `${currentRatio >= currentRatioTarget ? "+" : ""}${(currentRatio - currentRatioTarget).toFixed(1)}`,
          categoria: "standard",
          progressValue: Math.min((currentRatio / currentRatioTarget) * 100, 100),
          rawValue: currentRatio,
          rawTarget: currentRatioTarget,
        },
        {
          id: "margine_operativo",
          nome: "Margine Operativo",
          valore: `${operatingMargin.toFixed(1)}%`,
          target: `${operatingMarginTarget}%`,
          raggiunto: operatingMargin >= operatingMarginTarget,
          trend: `${operatingMarginTrend >= 0 ? "+" : ""}${operatingMarginTrend.toFixed(1)}%`,
          categoria: "standard",
          progressValue: Math.min((operatingMargin / operatingMarginTarget) * 100, 100),
          rawValue: operatingMargin,
          rawTarget: operatingMarginTarget,
        },
        {
          id: "burn_rate",
          nome: "Burn Rate Mensile",
          valore: `€${burnRate.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`,
          target: `€${burnRateTarget.toLocaleString("it-IT")}`,
          raggiunto: burnRate <= burnRateTarget,
          trend: `${burnRateTrend <= 0 ? "" : "+"}${burnRateTrend.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`,
          categoria: "personalizzato",
          progressValue: burnRate <= burnRateTarget ? 100 : Math.max(0, 100 - ((burnRate - burnRateTarget) / burnRateTarget) * 100),
          rawValue: burnRate,
          rawTarget: burnRateTarget,
        },
        {
          id: "revenue_growth",
          nome: "Crescita Ricavi",
          valore: `${revenueGrowth.toFixed(1)}%`,
          target: `${revenueGrowthTarget}%`,
          raggiunto: revenueGrowth >= revenueGrowthTarget,
          trend: `${revenueGrowth >= 0 ? "+" : ""}${revenueGrowth.toFixed(1)}%`,
          categoria: "personalizzato",
          progressValue: Math.min((revenueGrowth / revenueGrowthTarget) * 100, 100),
          rawValue: revenueGrowth,
          rawTarget: revenueGrowthTarget,
        },
      ];

      // Generate dynamic reports
      const reports: ReportData[] = [
        {
          id: `report-${format(now, "yyyy-MM")}`,
          nome: `Report ${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM/yyyy")}`,
          tipo: "Periodo",
          dataCreazione: format(now, "dd/MM/yyyy"),
          stato: "in elaborazione",
        },
      ];

      return { kpis, reports, transactionCount: transactions?.length ?? 0 };
    },
  });
}
