import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, subMonths, subYears, startOfYear, endOfYear, startOfQuarter, endOfQuarter, subQuarters } from "date-fns";

export type KPIPeriod = "month" | "quarter" | "year" | "custom";

export interface KPIResult {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  unit: string;
  trend: number | null; // % change vs previous period
  trendLabel: string;
  note?: string;
}

export interface KPITargets {
  ricavi: number;
  cashflow: number;
}

export function useKPITargets() {
  return useQuery({
    queryKey: ["kpi-targets"],
    queryFn: async () => {
      const { data } = await supabase
        .from("kpi_targets")
        .select("kpi_id, target_value");
      const map: Record<string, number> = {};
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

function getDateRange(period: KPIPeriod, customFrom?: Date, customTo?: Date) {
  const now = new Date();
  let from: Date, to: Date;
  switch (period) {
    case "month":
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
    case "quarter":
      from = startOfQuarter(now);
      to = endOfQuarter(now);
      break;
    case "year":
      from = startOfYear(now);
      to = now;
      break;
    case "custom":
      from = customFrom || startOfMonth(now);
      to = customTo || now;
      break;
    default:
      from = startOfMonth(now);
      to = now;
  }
  return { from, to };
}

function getPrevRange(period: KPIPeriod, from: Date, to: Date) {
  switch (period) {
    case "month": {
      const prevFrom = startOfMonth(subMonths(from, 1));
      const prevTo = endOfMonth(subMonths(from, 1));
      return { prevFrom, prevTo };
    }
    case "quarter": {
      const prevFrom = startOfQuarter(subQuarters(from, 1));
      const prevTo = endOfQuarter(subQuarters(from, 1));
      return { prevFrom, prevTo };
    }
    case "year": {
      const prevFrom = startOfYear(subYears(from, 1));
      // Compare same day range in previous year
      const prevTo = subYears(to, 1);
      return { prevFrom, prevTo };
    }
    default: {
      // Custom: mirror the exact duration before
      const diff = to.getTime() - from.getTime();
      const prevTo = new Date(from.getTime() - 1);
      const prevFrom = new Date(prevTo.getTime() - diff);
      return { prevFrom, prevTo };
    }
  }
}

const fmtEur = (v: number) => `€${v.toLocaleString("it-IT", { maximumFractionDigits: 0 })}`;
const fmtPct = (v: number) => v === 0 ? "N/D" : `${v.toFixed(1)}%`;
const fmtDays = (v: number) => `${Math.round(v)} gg`;

export function useKPIData(period: KPIPeriod = "year", customFrom?: Date, customTo?: Date) {
  const { data: targets } = useKPITargets();

  const { from, to } = getDateRange(period, customFrom, customTo);
  const { prevFrom, prevTo } = getPrevRange(from, to);

  const fromStr = format(from, "yyyy-MM-dd");
  const toStr = format(to, "yyyy-MM-dd");
  const prevFromStr = format(prevFrom, "yyyy-MM-dd");
  const prevToStr = format(prevTo, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["kpi-data", fromStr, toStr, targets],
    queryFn: async () => {
      // Fetch invoices and bank transactions in parallel
      const [emesseRes, ricevuteRes, prevEmesseRes, prevRicevuteRes, txRes, prevTxRes, employeesRes] = await Promise.all([
        supabase.from("invoices").select("amount, invoice_date, due_date")
          .in("invoice_type", ["emessa", "active", "income"])
          .gte("invoice_date", fromStr).lte("invoice_date", toStr),
        supabase.from("invoices").select("amount, invoice_date, due_date")
          .in("invoice_type", ["ricevuta", "passive", "expense"])
          .gte("invoice_date", fromStr).lte("invoice_date", toStr),
        supabase.from("invoices").select("amount, invoice_date, due_date")
          .in("invoice_type", ["emessa", "active", "income"])
          .gte("invoice_date", prevFromStr).lte("invoice_date", prevToStr),
        supabase.from("invoices").select("amount, invoice_date, due_date")
          .in("invoice_type", ["ricevuta", "passive", "expense"])
          .gte("invoice_date", prevFromStr).lte("invoice_date", prevToStr),
        supabase.from("bank_transactions").select("amount, date")
          .gte("date", fromStr).lte("date", toStr),
        supabase.from("bank_transactions").select("amount, date")
          .gte("date", prevFromStr).lte("date", prevToStr),
        supabase.from("employees").select("monthly_cost").eq("is_active", true),
      ]);

      // KPI 1: Ricavi (sum of taxable amounts from issued invoices)
      const ricavi = (emesseRes.data || []).reduce((s, inv) => s + Number(inv.amount || 0), 0);
      const prevRicavi = (prevEmesseRes.data || []).reduce((s, inv) => s + Number(inv.amount || 0), 0);
      const ricaviTrend = prevRicavi > 0 ? ((ricavi - prevRicavi) / prevRicavi) * 100 : null;

      // KPI 2: Primo Margine % = (Ricavi - Costi) / Ricavi * 100
      const costi = (ricevuteRes.data || []).reduce((s, inv) => s + Number(inv.amount || 0), 0);
      const prevCosti = (prevRicevuteRes.data || []).reduce((s, inv) => s + Number(inv.amount || 0), 0);
      const marginePreStipendi = ricavi - costi;
      const primoMargine = ricavi > 0 ? (marginePreStipendi / ricavi) * 100 : 0;
      const prevMargine = prevRicavi > 0 ? ((prevRicavi - prevCosti) / prevRicavi) * 100 : 0;
      const margineTrend = prevRicavi > 0 ? primoMargine - prevMargine : null;

      // KPI 3: EBITDA % = (EBITDA / Ricavi) * 100
      const monthlySalary = (employeesRes.data || []).reduce((s, e) => s + Number(e.monthly_cost || 0), 0);
      // Approximate salary for the period
      const periodMonths = Math.max(1, (to.getTime() - from.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const salaryForPeriod = monthlySalary * periodMonths;
      const ebitda = marginePreStipendi - salaryForPeriod;
      const ebitdaPct = ricavi > 0 ? (ebitda / ricavi) * 100 : 0;
      const prevEbitda = (prevRicavi - prevCosti) - salaryForPeriod;
      const prevEbitdaPct = prevRicavi > 0 ? (prevEbitda / prevRicavi) * 100 : 0;
      const ebitdaTrend = prevRicavi > 0 ? ebitdaPct - prevEbitdaPct : null;

      // KPI 4: Cash Flow (bank inflows - outflows)
      const bankInflows = (txRes.data || []).filter(tx => Number(tx.amount) > 0).reduce((s, tx) => s + Number(tx.amount), 0);
      const bankOutflows = Math.abs((txRes.data || []).filter(tx => Number(tx.amount) < 0).reduce((s, tx) => s + Number(tx.amount), 0));
      const cashFlow = bankInflows - bankOutflows;
      const prevInflows = (prevTxRes.data || []).filter(tx => Number(tx.amount) > 0).reduce((s, tx) => s + Number(tx.amount), 0);
      const prevOutflows = Math.abs((prevTxRes.data || []).filter(tx => Number(tx.amount) < 0).reduce((s, tx) => s + Number(tx.amount), 0));
      const prevCashFlow = prevInflows - prevOutflows;
      const cashFlowTrend = prevCashFlow !== 0 ? ((cashFlow - prevCashFlow) / Math.abs(prevCashFlow)) * 100 : null;
      // Collection ratio: bank inflows / total issued invoices (total_amount for cash comparison)
      const collectionRatio = ricavi > 0 ? (bankInflows / ricavi) * 100 : 0;

      // KPI 5: DSO (Days Sales Outstanding) - issued invoices
      const dsoDays = (emesseRes.data || []).map(inv => {
        if (!inv.due_date || !inv.invoice_date) return 0;
        const due = new Date(inv.due_date).getTime();
        const issue = new Date(inv.invoice_date).getTime();
        return Math.max(0, Math.round((due - issue) / (24 * 60 * 60 * 1000)));
      });
      const dso = dsoDays.length > 0 ? dsoDays.reduce((s, d) => s + d, 0) / dsoDays.length : 0;
      const prevDsoDays = (prevEmesseRes.data || []).map(inv => {
        if (!inv.due_date || !inv.invoice_date) return 0;
        const due = new Date(inv.due_date).getTime();
        const issue = new Date(inv.invoice_date).getTime();
        return Math.max(0, Math.round((due - issue) / (24 * 60 * 60 * 1000)));
      });
      const prevDso = prevDsoDays.length > 0 ? prevDsoDays.reduce((s, d) => s + d, 0) / prevDsoDays.length : 0;
      const dsoTrend = prevDso > 0 ? dso - prevDso : null;

      // KPI 6: DPO (Days Payable Outstanding) - received invoices
      const dpoDays = (ricevuteRes.data || []).map(inv => {
        if (!inv.due_date || !inv.invoice_date) return 0;
        const due = new Date(inv.due_date).getTime();
        const issue = new Date(inv.invoice_date).getTime();
        return Math.max(0, Math.round((due - issue) / (24 * 60 * 60 * 1000)));
      });
      const dpo = dpoDays.length > 0 ? dpoDays.reduce((s, d) => s + d, 0) / dpoDays.length : 0;
      const prevDpoDays = (prevRicevuteRes.data || []).map(inv => {
        if (!inv.due_date || !inv.invoice_date) return 0;
        const due = new Date(inv.due_date).getTime();
        const issue = new Date(inv.invoice_date).getTime();
        return Math.max(0, Math.round((due - issue) / (24 * 60 * 60 * 1000)));
      });
      const prevDpo = prevDpoDays.length > 0 ? prevDpoDays.reduce((s, d) => s + d, 0) / prevDpoDays.length : 0;
      const dpoTrend = prevDpo > 0 ? dpo - prevDpo : null;

      const noCompare = "Nessun dato nel periodo precedente per il confronto";

      const kpis: KPIResult[] = [
        {
          id: "ricavi",
          label: "Ricavi",
          value: fmtEur(ricavi),
          rawValue: ricavi,
          unit: "€",
          trend: ricaviTrend,
          trendLabel: ricaviTrend !== null ? `${ricaviTrend >= 0 ? "+" : ""}${ricaviTrend.toFixed(1)}% vs periodo prec.` : noCompare,
        },
        {
          id: "primo_margine",
          label: "Primo Margine",
          value: fmtPct(primoMargine),
          rawValue: primoMargine,
          unit: "%",
          trend: margineTrend,
          trendLabel: margineTrend !== null ? `${margineTrend >= 0 ? "+" : ""}${margineTrend.toFixed(1)}pp vs periodo prec.` : noCompare,
          note: "Margine prima degli stipendi / Ricavi",
        },
        {
          id: "ebitda",
          label: "EBITDA",
          value: fmtPct(ebitdaPct),
          rawValue: ebitdaPct,
          unit: "%",
          trend: ebitdaTrend,
          trendLabel: ebitdaTrend !== null ? `${ebitdaTrend >= 0 ? "+" : ""}${ebitdaTrend.toFixed(1)}pp vs periodo prec.` : noCompare,
          note: "Calcolato sui costi da fattura. Esclude ammortamenti e poste non fatturate.",
        },
        {
          id: "cashflow",
          label: "Cash Flow",
          value: fmtEur(cashFlow),
          rawValue: cashFlow,
          unit: "€",
          trend: cashFlowTrend,
          trendLabel: cashFlowTrend !== null ? `${cashFlowTrend >= 0 ? "+" : ""}${cashFlowTrend.toFixed(1)}% vs periodo prec.` : noCompare,
          note: `Significatività incassi: ${collectionRatio.toFixed(0)}%`,
        },
        {
          id: "dso",
          label: "DSO",
          value: fmtDays(dso),
          rawValue: dso,
          unit: "giorni",
          trend: dsoTrend,
          trendLabel: dsoTrend !== null ? `${dsoTrend >= 0 ? "+" : ""}${dsoTrend.toFixed(0)} gg vs periodo prec.` : noCompare,
          note: "Days Sales Outstanding — Tempo medio incasso fatture emesse",
        },
        {
          id: "dpo",
          label: "DPO",
          value: fmtDays(dpo),
          rawValue: dpo,
          unit: "giorni",
          trend: dpoTrend,
          trendLabel: dpoTrend !== null ? `${dpoTrend >= 0 ? "+" : ""}${dpoTrend.toFixed(0)} gg vs periodo prec.` : noCompare,
          note: "Days Payable Outstanding — Tempo medio pagamento fatture ricevute",
        },
      ];

      return { kpis, targets: targets || {} };
    },
  });
}
