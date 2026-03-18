import { useState, useEffect, useRef } from "react";
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
import {
  CONTO_ECONOMICO_EXPENSE_ROWS,
  CONTO_ECONOMICO_REVENUE_ROWS,
  ROW_LABELS,
} from "@/lib/conto-economico-schema";

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

const ROW_TOOLTIPS: Record<string, string> = {
  [ROW_LABELS.marginBeforePersonnel]: "È il margine di profitto generato prima di pagare eventuali compensi e costi del personale",
  [ROW_LABELS.ebitda]: "È il Margine Operativo Lordo (MOL) ossia il profitto generato dall'attività operativa e caratteristica, prima di considerare eventuali Ammortamenti, Accantonamenti, Svalutazioni, Interessi e Tasse",
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
  const aiReportRef = useRef<HTMLDivElement>(null);

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
      toast.success("Analisi AI completata!");
      setTimeout(() => aiReportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
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

  const {
    ricavi,
    ricaviTotali,
    costi,
    costiTotali,
    ivaRicavi,
    ivaCosti,
    ivaRicaviPagate,
    ivaCostiPagate,
    ivaRicaviDaPagare,
    ivaCostiDaPagare,
  } = data;

  const marginePrimaStipendi: MonthlyData = {};
  const personnelTotal: MonthlyData = {};
  const ebitda: MonthlyData = {};

  for (let m = 0; m < 12; m++) {
    marginePrimaStipendi[m] = (ricaviTotali[m] ?? 0) - (costiTotali[m] ?? 0);
    const salariM = personnel.salari[m] !== undefined ? personnel.salari[m] : defaultMonthlySalary;
    personnelTotal[m] = salariM + (personnel.amministratore[m] ?? 0);
    ebitda[m] = marginePrimaStipendi[m] - personnelTotal[m];
  }

  const hasFallbackRows = sumMonthly(ricavi.otherIncome) > 0 || sumMonthly(costi.otherExpenses) > 0;

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
      <tr className={cn("border-b border-border/50", options?.highlight, options?.warn && "bg-muted/40")}>
        <td className={cn(
          "py-1.5 px-3 text-xs whitespace-nowrap sticky left-0 z-10",
          options?.highlight ? options.highlight : "bg-card",
          options?.bold && "font-bold text-foreground",
          options?.indent && "pl-6 text-muted-foreground",
          options?.warn && "text-foreground font-medium"
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm text-muted-foreground">
            Analisi economica mensile basata solo sulle fatture — Anno <strong>{year}</strong>
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

        {hasFallbackRows && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/40 p-3 text-sm text-foreground">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span>
              Alcune fatture con categoria assente o non riconosciuta sono state incluse in <strong>Altre entrate</strong> o <strong>Altre uscite</strong>.
              Vai su <strong>Fatture</strong> per assegnare categorie più precise se necessario.
            </span>
          </div>
        )}

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
                {CONTO_ECONOMICO_REVENUE_ROWS.map((row) =>
                  renderRow(row.label, ricavi[row.key], { indent: true, tooltip: false, warn: row.key === "otherIncome" && hasFallbackRows })
                )}
                {renderSubtotal(ROW_LABELS.revenueTotal, ricaviTotali)}

                {CONTO_ECONOMICO_EXPENSE_ROWS.map((row) =>
                  renderRow(row.label, costi[row.key], { indent: true, warn: row.key === "otherExpenses" && hasFallbackRows })
                )}
                {renderSubtotal(ROW_LABELS.expenseTotal, costiTotali)}
                {renderSubtotal(ROW_LABELS.marginBeforePersonnel, marginePrimaStipendi, { negative: true })}

                <tr>
                  <td colSpan={14} className="px-3 py-1 text-[10px] text-muted-foreground italic">
                    {defaultMonthlySalary > 0
                      ? <><Users className="inline h-3 w-3 mr-1 mb-0.5" />Pre-popolato dai dipendenti in Configurazione (€{Math.round(defaultMonthlySalary).toLocaleString("it-IT")}/mese) — modifica singolo mese se necessario.</>
                      : "Inserisci i costi mensili del personale — non presenti nelle fatture ricevute."
                    }
                  </td>
                </tr>
                {renderEditableRow(ROW_LABELS.salaries, "salari")}
                {renderEditableRow(ROW_LABELS.directors, "amministratore")}
                {renderSubtotal(ROW_LABELS.ebitda, ebitda, { negative: true })}
              </tbody>
            </table>
          </div>
        </div>

        {aiReport && <div ref={aiReportRef}><AIReportSection report={aiReport} /></div>}

        <IVASection
          year={year}
          ivaRicavi={ivaRicavi}
          ivaCosti={ivaCosti}
          ivaRicaviPagate={ivaRicaviPagate}
          ivaCostiPagate={ivaCostiPagate}
          ivaRicaviDaPagare={ivaRicaviDaPagare}
          ivaCostiDaPagare={ivaCostiDaPagare}
          onYearChange={setYear}
          availableYears={[currentYear - 2, currentYear - 1, currentYear, currentYear + 1]}
        />
      </div>
    </TooltipProvider>
  );
}
