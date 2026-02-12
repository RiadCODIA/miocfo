import { useQuery } from "@tanstack/react-query";
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
}

interface ReportData {
  id: string;
  nome: string;
  tipo: string;
  dataCreazione: string;
  stato: "completato" | "in elaborazione" | "programmato";
}

export function useKPIData() {
  return useQuery({
    queryKey: ["kpi-data"],
    queryFn: async () => {
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

      // Get invoices for DSO calculation
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

      // Current month calculations
      const currentMonthTx = transactions?.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= currentMonthStart && txDate <= currentMonthEnd;
      }) || [];

      const currentMonthIncome = currentMonthTx.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      const currentMonthExpenses = Math.abs(currentMonthTx.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      const currentMonthProfit = currentMonthIncome - currentMonthExpenses;

      // Last month calculations
      const lastMonthTx = transactions?.filter(tx => {
        const txDate = new Date(tx.date);
        return txDate >= lastMonthStart && txDate <= lastMonthEnd;
      }) || [];

      const lastMonthIncome = lastMonthTx.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
      const lastMonthExpenses = Math.abs(lastMonthTx.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0));
      const lastMonthProfit = lastMonthIncome - lastMonthExpenses;

      // Calculate ROI (simplified: profit / total assets * 100)
      const roi = currentBalance > 0 ? ((currentMonthProfit / currentBalance) * 100) : 0;
      const lastRoi = currentBalance > 0 ? ((lastMonthProfit / currentBalance) * 100) : 0;
      const roiTarget = 15;
      const roiTrend = roi - lastRoi;

      // Calculate DSO (Days Sales Outstanding)
      const pendingReceivables = deadlines?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const avgDailyRevenue = currentMonthIncome / 30 || 1;
      const dso = Math.round(pendingReceivables / avgDailyRevenue);
      const dsoTarget = 45;

      // Calculate Current Ratio (current assets / current liabilities)
      const currentLiabilities = currentMonthExpenses || 1;
      const currentRatio = currentBalance / currentLiabilities;
      const currentRatioTarget = 1.5;

      // Calculate Operating Margin
      const operatingMargin = currentMonthIncome > 0 ? ((currentMonthProfit / currentMonthIncome) * 100) : 0;
      const lastOperatingMargin = lastMonthIncome > 0 ? ((lastMonthProfit / lastMonthIncome) * 100) : 0;
      const operatingMarginTarget = 28;
      const operatingMarginTrend = operatingMargin - lastOperatingMargin;

      // Calculate Burn Rate (monthly expenses)
      const burnRate = currentMonthExpenses;
      const lastBurnRate = lastMonthExpenses;
      const burnRateTarget = 60000;
      const burnRateTrend = burnRate - lastBurnRate;

      // Calculate Revenue Growth
      const revenueGrowth = lastMonthIncome > 0 ? ((currentMonthIncome - lastMonthIncome) / lastMonthIncome * 100) : 0;
      const revenueGrowthTarget = 10;

      const kpis: KPIData[] = [
        {
          id: "roi",
          nome: "ROI",
          valore: `${roi.toFixed(1)}%`,
          target: `${roiTarget}%`,
          raggiunto: roi >= roiTarget,
          trend: `${roiTrend >= 0 ? "+" : ""}${roiTrend.toFixed(1)}%`,
          categoria: "standard",
          progressValue: Math.min((roi / roiTarget) * 100, 100),
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
        },
      ];

      // Generate dynamic reports based on actual data
      const reports: ReportData[] = [];
      
      // Current month report (in progress)
      reports.push({
        id: `report-${format(now, "yyyy-MM")}`,
        nome: `Report Mensile ${format(now, "MMMM yyyy")}`,
        tipo: "Mensile",
        dataCreazione: format(currentMonthStart, "dd/MM/yyyy"),
        stato: "in elaborazione",
      });

      // Last month report (completed)
      reports.push({
        id: `report-${format(subMonths(now, 1), "yyyy-MM")}`,
        nome: `Report Mensile ${format(subMonths(now, 1), "MMMM yyyy")}`,
        tipo: "Mensile",
        dataCreazione: format(lastMonthStart, "dd/MM/yyyy"),
        stato: "completato",
      });

      // Two months ago (completed)
      reports.push({
        id: `report-${format(subMonths(now, 2), "yyyy-MM")}`,
        nome: `Report Mensile ${format(subMonths(now, 2), "MMMM yyyy")}`,
        tipo: "Mensile",
        dataCreazione: format(startOfMonth(subMonths(now, 2)), "dd/MM/yyyy"),
        stato: "completato",
      });

      // Quarterly report
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
