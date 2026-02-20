import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContoEconomico, MONTHS, MonthlyData } from "@/hooks/useContoEconomico";
import { IVASection } from "./IVASection";
import { AIReportSection, AIReport } from "./AIReportSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Brain, Loader2, AlertCircle, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const fmt = (v: number) => v === 0 ? "" : v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtPerc = (v: number) => isNaN(v) || !isFinite(v) ? "" : `${v.toFixed(1)}%`;

const PERSONNEL_KEY = "area-economica-personnel";

interface PersonnelData {
  salari: MonthlyData;
  amministratore: MonthlyData;
}

function loadPersonnel(year: number): PersonnelData {
  try {
    const raw = localStorage.getItem(`${PERSONNEL_KEY}-${year}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { salari: {}, amministratore: {} };
}

function savePersonnel(year: number, data: PersonnelData) {
  localStorage.setItem(`${PERSONNEL_KEY}-${year}`, JSON.stringify(data));
}

function sumMonthly(data: MonthlyData): number {
  return Object.values(data).reduce((s, v) => s + v, 0);
}

export function ContoEconomicoTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useContoEconomico(year);
  const [personnel, setPersonnel] = useState<PersonnelData>(() => loadPersonnel(year));
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Load active employees for pre-populating salari row
  const { data: employeesData } = useQuery({
    queryKey: ["employees-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employees")
        .select("monthly_cost")
        .eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const defaultMonthlySalary = employeesData?.reduce((sum, e) => sum + (e.monthly_cost || 0), 0) ?? 0;

  useEffect(() => {
    setPersonnel(loadPersonnel(year));
    setAiReport(null);
  }, [year]);

  const handlePersonnelChange = (field: "salari" | "amministratore", month: number, value: string) => {
    const num = parseFloat(value.replace(/[^\d.-]/g, "")) || 0;
    const updated = {
      ...personnel,
      [field]: { ...personnel[field], [month]: num },
    };
    setPersonnel(updated);
    savePersonnel(year, updated);
  };

  const handleAIAnalysis = async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const personnelTotal: MonthlyData = {};
      const margineContribuzione: MonthlyData = {};
      const ebitda: MonthlyData = {};

      for (let m = 0; m < 12; m++) {
        const salariM = personnel.salari[m] !== undefined ? personnel.salari[m] : defaultMonthlySalary;
        personnelTotal[m] = salariM + (personnel.amministratore[m] || 0);
        margineContribuzione[m] = (data.ricavi[m] || 0) - (data.costiVariabiliTotali[m] || 0);
        ebitda[m] = margineContribuzione[m] - (data.costiFissiTotali[m] || 0) - personnelTotal[m];
      }

      const payload = {
        year,
        data: {
          ricaviFatture: data.ricavi,
          ricaviTotali: data.ricavi,
          costiFatture: data.costiTotali,
          costiTotali: data.costiTotali,
          margineContribuzione,
          costiPersonale: personnelTotal,
          ebitda,
          mesi: MONTHS,
        },
      };

      const { data: result, error } = await supabase.functions.invoke("analyze-conto-economico", {
        body: payload,
      });

      if (error) throw error;
      if (result?.error) {
        toast({ title: "Errore AI", description: result.error, variant: "destructive" });
        return;
      }

      setAiReport(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Errore durante l'analisi AI";
      console.error("AI analysis error:", e);
      toast({ title: "Errore", description: msg, variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  if (!data) return null;

  const ricavi = data.ricavi ?? {};
  const costiVariabili = data.costiVariabili ?? {};
  const costiFissi = data.costiFissi ?? {};
  const costiNonCategorizzati = data.costiNonCategorizzati ?? {};
  const costiVariabiliTotali = data.costiVariabiliTotali ?? {};
  const costiFissiTotali = data.costiFissiTotali ?? {};
  const costiTotali = data.costiTotali ?? {};
  const ivaRicavi = data.ivaRicavi ?? {};
  const ivaCosti = data.ivaCosti ?? {};
  const variableCategories = data.variableCategories ?? [];
  const fixedCategories = data.fixedCategories ?? [];

  // Derived rows
  const margineContribuzione: MonthlyData = {};
  const personnelTotal: MonthlyData = {};
  const ebitda: MonthlyData = {};

  for (let m = 0; m < 12; m++) {
    margineContribuzione[m] = (ricavi[m] ?? 0) - (costiVariabiliTotali[m] ?? 0);
    const salariM = personnel.salari[m] !== undefined ? personnel.salari[m] : defaultMonthlySalary;
    personnelTotal[m] = salariM + (personnel.amministratore[m] ?? 0);
    ebitda[m] = margineContribuzione[m] - (costiFissiTotali[m] ?? 0) - personnelTotal[m];
  }

  const totalRicavi = sumMonthly(ricavi);
  const hasUncategorized = sumMonthly(costiNonCategorizzati) > 0;

  const renderValueCell = (value: number, isTotal = false, isNegative = false) => (
    <td className={cn(
      "py-1.5 px-2 text-right text-xs whitespace-nowrap",
      isTotal && "font-bold",
      isNegative && value < 0 && "text-destructive",
      !isNegative && value > 0 && isTotal && "text-primary"
    )}>
      {fmt(value)}
    </td>
  );

  const renderRow = (label: string, monthlyData: MonthlyData, options?: {
    bold?: boolean;
    highlight?: string; // tailwind bg class
    negative?: boolean;
    indent?: boolean;
    warn?: boolean;
  }) => {
    const total = sumMonthly(monthlyData);
    return (
      <tr className={cn(
        "border-b border-border/50",
        options?.highlight,
        options?.warn && "bg-amber-500/10"
      )}>
        <td className={cn(
          "py-1.5 px-3 text-xs whitespace-nowrap sticky left-0 z-10",
          options?.highlight ? options.highlight : "bg-card",
          options?.bold && "font-bold text-foreground",
          options?.indent && "pl-6 text-muted-foreground",
          options?.warn && "text-amber-700 dark:text-amber-400 font-medium"
        )}>
          {options?.warn && <AlertCircle className="inline h-3 w-3 mr-1 mb-0.5" />}
          {label}
        </td>
        {Array.from({ length: 12 }).map((_, m) => renderValueCell(monthlyData[m] || 0, options?.bold, options?.negative))}
        <td className={cn(
          "py-1.5 px-2 text-right text-xs font-bold whitespace-nowrap",
          options?.negative && total < 0 && "text-destructive",
          !options?.negative && total > 0 && options?.bold && "text-primary"
        )}>
          {fmt(total)}
        </td>
      </tr>
    );
  };

  const renderPercentRow = (label: string, monthlyData: MonthlyData) => (
    <tr className="border-b border-border/30">
      <td className="py-1 px-3 text-[10px] text-muted-foreground italic sticky left-0 bg-card z-10">{label}</td>
      {Array.from({ length: 12 }).map((_, m) => (
        <td key={m} className="py-1 px-2 text-right text-[10px] text-muted-foreground italic">
          {fmtPerc(((monthlyData[m] || 0) / (ricavi[m] || 1)) * 100)}
        </td>
      ))}
      <td className="py-1 px-2 text-right text-[10px] text-muted-foreground italic">
        {fmtPerc((sumMonthly(monthlyData) / (totalRicavi || 1)) * 100)}
      </td>
    </tr>
  );

  const renderSectionHeader = (label: string) => (
    <tr className="bg-muted/40">
      <td colSpan={14} className="py-1.5 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide sticky left-0">
        {label}
      </td>
    </tr>
  );

  const renderSubtotal = (label: string, monthlyData: MonthlyData, options?: { negative?: boolean }) => {
    const total = sumMonthly(monthlyData);
    return (
      <tr className="border-b-2 border-border bg-muted/20">
        <td className="py-2 px-3 text-xs font-bold text-foreground sticky left-0 bg-muted/20 z-10">{label}</td>
        {Array.from({ length: 12 }).map((_, m) => (
        <td key={m} className={cn(
            "py-2 px-2 text-right text-xs font-bold whitespace-nowrap",
            options?.negative && (monthlyData[m] || 0) < 0 && "text-destructive",
            !options?.negative && (monthlyData[m] || 0) >= 0 && "text-primary"
          )}>
            {fmt(monthlyData[m] || 0)}
          </td>
        ))}
        <td className={cn(
          "py-2 px-2 text-right text-xs font-bold whitespace-nowrap",
          options?.negative && total < 0 && "text-destructive",
          !options?.negative && total >= 0 && "text-primary"
        )}>
          {fmt(total)}
        </td>
      </tr>
    );
  };

  const renderEditableRow = (label: string, field: "salari" | "amministratore") => (
    <tr className="border-b border-border/50">
      <td className="py-1 px-3 text-xs whitespace-nowrap sticky left-0 bg-card z-10">{label}</td>
      {Array.from({ length: 12 }).map((_, m) => {
        const savedValue = personnel[field][m];
        const displayValue = savedValue !== undefined ? savedValue : (field === "salari" ? defaultMonthlySalary : 0);
        return (
          <td key={m} className="py-0.5 px-1">
            <Input
              type="number"
              value={displayValue || ""}
              onChange={(e) => handlePersonnelChange(field, m, e.target.value)}
              placeholder={field === "salari" && defaultMonthlySalary > 0 ? String(Math.round(defaultMonthlySalary)) : "0"}
              className="h-7 text-xs text-right w-16 bg-muted/50 border-border/50 px-1"
            />
          </td>
        );
      })}
      <td className="py-1.5 px-2 text-right text-xs font-semibold">
        {fmt(field === "salari" && Object.keys(personnel[field]).length === 0
          ? defaultMonthlySalary * 12
          : sumMonthly(personnel[field])
        )}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Year selector + AI button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-muted-foreground">Analisi economica mensile basata su fatture emesse e ricevute</p>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAIAnalysis}
            disabled={aiLoading}
            className="gap-2"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            {aiLoading ? "Analisi in corso..." : "Analisi AI"}
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Anno:</span>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Alert for uncategorized */}
      {hasUncategorized && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Alcune fatture ricevute non hanno una categoria abbinata e appaiono come <strong>Non categorizzato</strong>.
            Vai su <strong>Fatture</strong> per assegnare la categoria corretta a ciascuna voce.
          </span>
        </div>
      )}

      {/* Main P&L table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[200px]">Voce</th>
                {MONTHS.map((m) => (
                  <th key={m} className="py-2 px-2 text-right text-xs font-semibold text-muted-foreground w-16">{m}</th>
                ))}
                <th className="py-2 px-2 text-right text-xs font-semibold text-muted-foreground w-20">TOTALE</th>
              </tr>
            </thead>
            <tbody>
              {/* ── RICAVI ── */}
              {renderSectionHeader("Ricavi")}
              {renderRow("Ricavi da fatture emesse", ricavi)}
              {renderSubtotal("TOTALE RICAVI", ricavi)}

              {/* ── COSTI VARIABILI ── */}
              {renderSectionHeader("Costi Variabili")}
              {variableCategories.map((cat) =>
                renderRow(cat.name, costiVariabili[cat.id] ?? {}, { indent: true })
              )}
              {hasUncategorized &&
                renderRow("Non categorizzato", costiNonCategorizzati, { indent: true, warn: true })
              }
              {renderSubtotal("TOTALE COSTI VARIABILI", costiVariabiliTotali)}

              {/* ── MARGINE DI CONTRIBUZIONE ── */}
              {renderSubtotal("MARGINE DI CONTRIBUZIONE", margineContribuzione, { negative: true })}
              {renderPercentRow("% sul fatturato", margineContribuzione)}

              {/* ── COSTI FISSI ── */}
              {renderSectionHeader("Costi Fissi")}
              {fixedCategories.map((cat) =>
                renderRow(cat.name, costiFissi[cat.id] ?? {}, { indent: true })
              )}
              {renderSubtotal("TOTALE COSTI FISSI", costiFissiTotali)}

              {/* ── PERSONALE (manual) ── */}
              {renderSectionHeader("Costi Personale")}
              <tr>
                <td colSpan={14} className="px-3 py-1 text-[10px] text-muted-foreground italic">
                  {defaultMonthlySalary > 0
                    ? <><Users className="inline h-3 w-3 mr-1 mb-0.5" />Pre-popolato dai dipendenti in Configurazione (€{Math.round(defaultMonthlySalary).toLocaleString("it-IT")}/mese) — modifica singolo mese se necessario.</>
                    : "Inserisci i costi mensili del personale — non presenti nelle fatture ricevute."
                  }
                </td>
              </tr>
              {renderEditableRow("Salari e stipendi", "salari")}
              {renderEditableRow("Compenso amministratore", "amministratore")}

              {/* ── EBITDA ── */}
              {renderSubtotal("EBITDA", ebitda, { negative: true })}
              {renderPercentRow("% sul fatturato", ebitda)}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Report */}
      {aiReport && <AIReportSection report={aiReport} />}

      {/* IVA Section */}
      <IVASection year={year} ivaRicavi={ivaRicavi} ivaCosti={ivaCosti} />
    </div>
  );
}
