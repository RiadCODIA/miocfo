import { useState, useEffect } from "react";
import { useContoEconomico, MONTHS, MonthlyData } from "@/hooks/useContoEconomico";
import { IVASection } from "./IVASection";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    setPersonnel(loadPersonnel(year));
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

  if (isLoading) {
    return <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>;
  }

  if (!data) return null;

  const { ricavi, costiPerCategoria, costiTotali, ivaRicavi, ivaCosti, categoryNames } = data;

  // Compute margins
  const primoMargine: MonthlyData = {};
  const personnelTotal: MonthlyData = {};
  const ebitda: MonthlyData = {};

  for (let m = 0; m < 12; m++) {
    primoMargine[m] = (ricavi[m] || 0) - (costiTotali[m] || 0);
    personnelTotal[m] = (personnel.salari[m] || 0) + (personnel.amministratore[m] || 0);
    ebitda[m] = primoMargine[m] - personnelTotal[m];
  }

  const totalRicavi = sumMonthly(ricavi);

  const renderValueCell = (value: number, isTotal = false, isNegative = false) => (
    <td className={cn(
      "py-1.5 px-2 text-right text-xs whitespace-nowrap",
      isTotal && "font-bold",
      isNegative && value < 0 && "text-destructive",
      !isNegative && value > 0 && isTotal && "text-success"
    )}>
      {fmt(value)}
    </td>
  );

  const renderRow = (label: string, monthlyData: MonthlyData, options?: { bold?: boolean; highlight?: boolean; negative?: boolean }) => {
    const total = sumMonthly(monthlyData);
    return (
      <tr className={cn(
        "border-b border-border/50",
        options?.highlight && "bg-muted/30",
        options?.bold && "font-semibold"
      )}>
        <td className={cn("py-1.5 px-3 text-xs whitespace-nowrap sticky left-0 bg-card z-10", options?.bold && "font-bold text-foreground")}>
          {label}
        </td>
        {Array.from({ length: 12 }).map((_, m) => renderValueCell(monthlyData[m] || 0, options?.bold, options?.negative))}
        <td className={cn(
          "py-1.5 px-2 text-right text-xs font-bold whitespace-nowrap",
          options?.negative && total < 0 && "text-destructive",
          !options?.negative && total > 0 && options?.bold && "text-success"
        )}>
          {fmt(total)}
        </td>
      </tr>
    );
  };

  const renderPercentRow = (label: string, monthlyData: MonthlyData) => {
    return (
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
  };

  const renderEditableRow = (label: string, field: "salari" | "amministratore") => (
    <tr className="border-b border-border/50">
      <td className="py-1 px-3 text-xs whitespace-nowrap sticky left-0 bg-card z-10">{label}</td>
      {Array.from({ length: 12 }).map((_, m) => (
        <td key={m} className="py-0.5 px-1">
          <Input
            type="number"
            value={personnel[field][m] || ""}
            onChange={(e) => handlePersonnelChange(field, m, e.target.value)}
            placeholder="0"
            className="h-7 text-xs text-right w-16 bg-muted/50 border-border/50 px-1"
          />
        </td>
      ))}
      <td className="py-1.5 px-2 text-right text-xs font-semibold">
        {fmt(sumMonthly(personnel[field]))}
      </td>
    </tr>
  );

  return (
    <div className="space-y-6">
      {/* Year selector */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Analisi economica mensile basata su fatture emesse e ricevute</p>
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

      {/* Main table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="py-2 px-3 text-left text-xs font-semibold text-muted-foreground sticky left-0 bg-muted/50 z-10 min-w-[180px]">Categoria</th>
                {MONTHS.map((m) => (
                  <th key={m} className="py-2 px-2 text-right text-xs font-semibold text-muted-foreground w-16">{m}</th>
                ))}
                <th className="py-2 px-2 text-right text-xs font-semibold text-muted-foreground w-20">TOTALE</th>
              </tr>
            </thead>
            <tbody>
              {/* RICAVI */}
              {renderRow("RICAVI DA FATTURE EMESSE", ricavi, { bold: true, highlight: true })}

              {/* COSTI header */}
              <tr className="bg-muted/20">
                <td colSpan={14} className="py-1.5 px-3 text-xs font-bold text-muted-foreground uppercase">Costi</td>
              </tr>
              {categoryNames.map((cat) => renderRow(cat, costiPerCategoria[cat] || {}))}

              {/* PRIMO MARGINE */}
              {renderRow("PRIMO MARGINE", primoMargine, { bold: true, highlight: true, negative: true })}
              {renderPercentRow("% sul fatturato", primoMargine)}

              {/* Personnel info */}
              <tr className="bg-amber-500/10">
                <td colSpan={14} className="py-2 px-3 text-xs text-amber-600 dark:text-amber-400">
                  <strong>Inserimento manuale dei valori:</strong> Inserire i costi totali del personale e compensi amministratore. Il sistema aggiornerà automaticamente il conto economico.
                </td>
              </tr>
              {renderEditableRow("Salari e stipendi", "salari")}
              {renderEditableRow("Compenso amministratore", "amministratore")}

              {/* EBITDA */}
              {renderRow("MARGINE OPERATIVO (EBITDA)", ebitda, { bold: true, highlight: true, negative: true })}
              {renderPercentRow("% sul fatturato", ebitda)}
            </tbody>
          </table>
        </div>
      </div>

      {/* IVA Section */}
      <IVASection year={year} ivaRicavi={ivaRicavi} ivaCosti={ivaCosti} />
    </div>
  );
}
