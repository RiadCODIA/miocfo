import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

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

  return useQuery({
    queryKey: ["kpi-data", targets],
    enabled: !!targets,
    queryFn: async () => {
      const t = targets || DEFAULT_TARGETS;
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      const sixMonthsAgo = subMonths(now, 6);

      // Get transactions for calculations
      const { data: transactions } = await supabase
        .from("bank_transactions")
        .select("*")
        .gte("date", format(sixMonthsAgo, "yyyy-MM-dd"))
        .order("date", { ascending: false });

      // Get bank accounts for balance
      const { data: accounts } = await supabase
        .from("bank_accounts")
        .select("balance")
        .eq("is_connected", true);

      // Get invoices for ROS and DSO
      const { data: invoices } = await supabase
        .from("invoices")
        .select("*")
        .gte("invoice_date", format(sixMonthsAgo, "yyyy-MM-dd"));

      // Get deadlines for receivables
      const { data: deadlines } = await supabase
        .from("deadlines")
        .select("*")
        .eq("deadline_type", "incasso")
        .eq("status", "pending");

      const currentBalance = accounts?.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0) || 0;

      // Current month transactions
      const currentMonthTx = transactions?.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= currentMonthStart && txDate <= currentMonthEnd;
      }) || [];

      const currentMonthIncome = currentMonthTx.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      const currentMonthExpenses = Math.abs(currentMonthTx.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      const currentMonthProfit = currentMonthIncome - currentMonthExpenses;

      // Last month transactions
      const lastMonthTx = transactions?.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= lastMonthStart && txDate <= lastMonthEnd;
      }) || [];

      const lastMonthIncome = lastMonthTx.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      const lastMonthExpenses = Math.abs(lastMonthTx.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      const lastMonthProfit = lastMonthIncome - lastMonthExpenses;

      // ---- ROS (Return on Sales) from invoices ----
      const currentMonthInvoices = invoices?.filter(inv => {
        const d = new Date(inv.invoice_date || "");
        return d >= currentMonthStart && d <= currentMonthEnd;
      }) || [];

      const lastMonthInvoices = invoices?.filter(inv => {
        const d = new Date(inv.invoice_date || "");
        return d >= lastMonthStart && d <= lastMonthEnd;
      }) || [];

      const ricaviCurrent = currentMonthInvoices
        .filter(inv => inv.invoice_type === "emessa" || inv.invoice_type === "income")
        .reduce((s, inv) => s + Number(inv.amount), 0);
      const costiCurrent = currentMonthInvoices
        .filter(inv => inv.invoice_type === "ricevuta" || inv.invoice_type === "expense")
        .reduce((s, inv) => s + Number(inv.amount), 0);
      const ebitdaCurrent = ricaviCurrent - costiCurrent;
      const ros = ricaviCurrent > 0 ? (ebitdaCurrent / ricaviCurrent) * 100 : 0;

      const ricaviLast = lastMonthInvoices
        .filter(inv => inv.invoice_type === "emessa" || inv.invoice_type === "income")
        .reduce((s, inv) => s + Number(inv.amount), 0);
      const costiLast = lastMonthInvoices
        .filter(inv => inv.invoice_type === "ricevuta" || inv.invoice_type === "expense")
        .reduce((s, inv) => s + Number(inv.amount), 0);
      const ebitdaLast = ricaviLast - costiLast;
      const rosLast = ricaviLast > 0 ? (ebitdaLast / ricaviLast) * 100 : 0;
      const rosTrend = ros - rosLast;
      const rosTarget = t.ros;

      // DSO
      const pendingReceivables = deadlines?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const avgDailyRevenue = currentMonthIncome / 30 || 1;
      const dso = Math.round(pendingReceivables / avgDailyRevenue);
      const dsoTarget = t.dso;

      // Current Ratio
      const currentLiabilities = currentMonthExpenses || 1;
      const currentRatio = currentBalance / currentLiabilities;
      const currentRatioTarget = t.current_ratio;

      // Operating Margin
      const operatingMargin = currentMonthIncome > 0 ? ((currentMonthProfit / currentMonthIncome) * 100) : 0;
      const lastOperatingMargin = lastMonthIncome > 0 ? ((lastMonthProfit / lastMonthIncome) * 100) : 0;
      const operatingMarginTarget = t.margine_operativo;
      const operatingMarginTrend = operatingMargin - lastOperatingMargin;

      // Burn Rate
      const burnRate = currentMonthExpenses;
      const lastBurnRate = lastMonthExpenses;
      const burnRateTarget = t.burn_rate;
      const burnRateTrend = burnRate - lastBurnRate;

      // Revenue Growth
      const revenueGrowth = lastMonthIncome > 0 ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
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
      const reports: ReportData[] = [];
      reports.push({
        id: `report-${format(now, "yyyy-MM")}`,
        nome: `Report Mensile ${format(now, "MMMM yyyy")}`,
        tipo: "Mensile",
        dataCreazione: format(currentMonthStart, "dd/MM/yyyy"),
        stato: "in elaborazione",
      });
      reports.push({
        id: `report-${format(subMonths(now, 1), "yyyy-MM")}`,
        nome: `Report Mensile ${format(subMonths(now, 1), "MMMM yyyy")}`,
        tipo: "Mensile",
        dataCreazione: format(lastMonthStart, "dd/MM/yyyy"),
        stato: "completato",
      });
      reports.push({
        id: `report-${format(subMonths(now, 2), "yyyy-MM")}`,
        nome: `Report Mensile ${format(subMonths(now, 2), "MMMM yyyy")}`,
        tipo: "Mensile",
        dataCreazione: format(startOfMonth(subMonths(now, 2)), "dd/MM/yyyy"),
        stato: "completato",
      });
      const quarter = Math.floor(now.getMonth() / 3) + 1;
      reports.push({
        id: `report-q${quarter}-${now.getFullYear()}`,
        nome: `Report Trimestrale Q${quarter} ${now.getFullYear()}`,
        tipo: "Trimestrale",
        dataCreazione: format(startOfMonth(subMonths(now, now.getMonth() % 3)), "dd/MM/yyyy"),
        stato: quarter === Math.floor(now.getMonth() / 3) + 1 ? "in elaborazione" : "completato",
      });

      return { kpis, reports, transactionCount: transactions?.length ?? 0 };
    },
  });
}
