import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useContoEconomico, MONTHS, MonthlyData } from "@/hooks/useContoEconomico";
import { IVASection } from "./IVASection";
import { AIReportSection, AIReport } from "./AIReportSection";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Brain, Loader2, AlertCircle, Users, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fmt = (v: number) => v === 0 ? "" : v.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

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

/** Tooltip descriptions for specific rows */
const ROW_TOOLTIPS: Record<string, string> = {
  "Acquisto materie prime": "Comprende l'acquisto di materie prime, materiali di consumo, merci, semilavorati e prodotti simili",
  "Energia e combustibili": "Comprende canoni di energia elettrica, gas e acqua",
  "MARGINE PRIMA DEGLI STIPENDI": "È il margine di profitto generato prima di pagare eventuali compensi e costi del personale",
  "EBITDA": "È il Margine Operativo Lordo (MOL) ossia il profitto generato dall'attività operativa e caratteristica, prima di considerare eventuali Ammortamenti, Accantonamenti, Svalutazioni, Interessi e Tasse",
};

function InfoTooltip({ label }: { label: string }) {
  const tip = ROW_TOOLTIPS[label];
  if (!tip) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="inline h-3.5 w-3.5 ml-1.5 text-muted-foreground/60 hover:text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs text-xs">
        {tip}
      </TooltipContent>
    </Tooltip>
  );
}

export function ContoEconomicoTab() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const { data, isLoading } = useContoEconomico(year);
  const [personnel, setPersonnel] = useState<PersonnelData>(() => loadPersonnel(year));
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

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
    const updated = { ...personnel, [field]: { ...personnel[field], [month]: num } };
    setPersonnel(updated);
    savePersonnel(year, updated);
  };

  const handleAIAnalysis = async () => {
    if (!data) return;
    setAiLoading(true);
    try {
      const personnelTotal: MonthlyData = {};
      const marginePrimaStipendi: MonthlyData = {};
      const ebitda: MonthlyData = {};

      for (let m = 0; m < 12; m++) {
        const salariM = personnel.salari[m] !== undefined ? personnel.salari[m] : defaultMonthlySalary;
        personnelTotal[m] = salariM + (personnel.amministratore[m] || 0);
        marginePrimaStipendi[m] = (data.ricaviTotali[m] || 0) - (data.costiTotali[m] || 0);
        ebitda[m] = marginePrimaStipendi[m] - personnelTotal[m];
      }

      const payload = {
        year,
        data: {
          ricaviTotali: data.ricaviTotali,
          costiTotali: data.costiTotali,
          marginePrimaStipendi,
          costiPersonale: personnelTotal,
          ebitda,
          mesi: MONTHS,
        },
      };

      const { data: result, error } = await supabase.functions.invoke("analyze-conto-economico", { body: payload });
      if (error) { console.error("AI invoke error:", error); throw error; }
      if (!result) { toast.error("Errore AI", { description: "Nessuna risposta dall'analisi AI" }); return; }
      if (result?.error) { toast.error("Errore AI", { description: result.error }); return; }
      setAiReport(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Errore durante l'analisi AI";
      console.error("AI analysis error:", e);
      toast.error("Errore", { description: msg });
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }
  if (!data) return null;

  const { ricaviPerCategoria, ricaviTotali, revenueCategories, costi, costiNonCategorizzati, costiTotali, orderedCostCategories, ivaRicavi, ivaCosti } = data;

  // Derived rows
  const marginePrimaStipendi: MonthlyData = {};
  const personnelTotal: MonthlyData = {};
  const ebitda: MonthlyData = {};

  for (let m = 0; m < 12; m++) {
    marginePrimaStipendi[m] = (ricaviTotali[m] ?? 0) - (costiTotali[m] ?? 0);
    const salariM = personnel.salari[m] !== undefined ? personnel.salari[m] : defaultMonthlySalary;
    personnelTotal[m] = salariM + (personnel.amministratore[m] ?? 0);
    ebitda[m] = marginePrimaStipendi[m] - personnelTotal[m];
  }

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
    bold?: boolean; highlight?: string; negative?: boolean; indent?: boolean; warn?: boolean; tooltip?: boolean;
  }) => {
    const total = sumMonthly(monthlyData);
    return (
      <tr className={cn("border-b border-border/50", options?.highlight, options?.warn && "bg-amber-500/10")}>
        <td className={cn(
          "py-1.5 px-3 text-xs whitespace-nowrap sticky left-0 z-10",
          options?.highlight ? options.highlight : "bg-card",
          options?.bold && "font-bold text-foreground",
          options?.indent && "pl-6 text-muted-foreground",
          options?.warn && "text-amber-700 dark:text-amber-400 font-medium"
        )}>
          {options?.warn && <AlertCircle className="inline h-3 w-3 mr-1 mb-0.5" />}
          {label}
          {options?.tooltip !== false && <InfoTooltip label={label} />}
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

  const renderSubtotal = (label: string, monthlyData: MonthlyData, options?: { negative?: boolean }) => {
    const total = sumMonthly(monthlyData);
    return (
      <tr className="border-b-2 border-border bg-muted/20">
        <td className="py-2 px-3 text-xs font-bold text-foreground sticky left-0 bg-muted/20 z-10">
          {label}
          <InfoTooltip label={label} />
        </td>
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
    <TooltipProvider delayDuration={200}>
      <div className="space-y-6">
        {/* Year selector + AI button */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Analisi economica mensile basata su fatture emesse e ricevute — Anno <strong>{year}</strong>
          </p>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleAIAnalysis} disabled={aiLoading} className="gap-2">
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              {aiLoading ? "Analisi in corso..." : "Analisi AI"}
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Anno:</span>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-24 h-8 text-sm"><SelectValue /></SelectTrigger>
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
                {revenueCategories.map((cat) =>
                  renderRow(cat.name, ricaviPerCategoria[cat.id] ?? {}, { indent: true, tooltip: false })
                )}
                {renderSubtotal("TOTALE RICAVI", ricaviTotali)}

                {/* ── COSTI (flat) ── */}
                {orderedCostCategories.map((cat) =>
                  renderRow(cat.name, costi[cat.id] ?? {}, { indent: true })
                )}
                {hasUncategorized &&
                  renderRow("Non categorizzato", costiNonCategorizzati, { indent: true, warn: true, tooltip: false })
                }
                {renderSubtotal("TOTALE COSTI", costiTotali)}

                {/* ── MARGINE PRIMA DEGLI STIPENDI ── */}
                {renderSubtotal("MARGINE PRIMA DEGLI STIPENDI", marginePrimaStipendi, { negative: true })}

                {/* ── PERSONALE (manual) ── */}
                <tr>
                  <td colSpan={14} className="px-3 py-1 text-[10px] text-muted-foreground italic">
                    {defaultMonthlySalary > 0
                      ? <><Users className="inline h-3 w-3 mr-1 mb-0.5" />Pre-popolato dai dipendenti in Configurazione (€{Math.round(defaultMonthlySalary).toLocaleString("it-IT")}/mese) — modifica singolo mese se necessario.</>
                      : "Inserisci i costi mensili del personale — non presenti nelle fatture ricevute."
                    }
                  </td>
                </tr>
                {renderEditableRow("Salari, stipendi e oneri sociali", "salari")}
                {renderEditableRow("Compenso soci/amministratori", "amministratore")}

                {/* ── EBITDA ── */}
                {renderSubtotal("EBITDA", ebitda, { negative: true })}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Report */}
        {aiReport && <AIReportSection report={aiReport} />}

        {/* IVA Section */}
        <IVASection year={year} ivaRicavi={ivaRicavi} ivaCosti={ivaCosti} />
      </div>
    </TooltipProvider>
  );
}
