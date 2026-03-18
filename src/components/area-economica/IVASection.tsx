import { useState } from "react";
import { MonthlyData } from "@/hooks/useContoEconomico";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IVASectionProps {
  year: number;
  ivaRicavi: MonthlyData;
  ivaCosti: MonthlyData;
  ivaRicaviPagate: MonthlyData;
  ivaCostiPagate: MonthlyData;
  ivaRicaviDaPagare: MonthlyData;
  ivaCostiDaPagare: MonthlyData;
  onYearChange: (year: number) => void;
  availableYears: number[];
}

type IVAPeriod = "annuale" | "trimestrale" | "mensile";
type IVAStatusFilter = "totale" | "pagate" | "da_pagare";

const MONTHS = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
const QUARTERS: { label: string; months: number[] }[] = [
  { label: "Q1 (Gen-Mar)", months: [0, 1, 2] },
  { label: "Q2 (Apr-Giu)", months: [3, 4, 5] },
  { label: "Q3 (Lug-Set)", months: [6, 7, 8] },
  { label: "Q4 (Ott-Dic)", months: [9, 10, 11] },
];

const fmt = (v: number) =>
  `${v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

function filterByMonths(data: MonthlyData, months: number[]): number {
  return months.reduce((sum, monthIndex) => sum + (data[monthIndex] || 0), 0);
}

export function IVASection({
  year,
  ivaRicavi,
  ivaCosti,
  ivaRicaviPagate,
  ivaCostiPagate,
  ivaRicaviDaPagare,
  ivaCostiDaPagare,
  onYearChange,
  availableYears,
}: IVASectionProps) {
  const [period, setPeriod] = useState<IVAPeriod>("annuale");
  const [statusFilter, setStatusFilter] = useState<IVAStatusFilter>("totale");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3));

  const selectedData = {
    totale: { ivaRicavi, ivaCosti, label: "Tutte le fatture" },
    pagate: { ivaRicavi: ivaRicaviPagate, ivaCosti: ivaCostiPagate, label: "Solo fatture pagate/incassate" },
    da_pagare: { ivaRicavi: ivaRicaviDaPagare, ivaCosti: ivaCostiDaPagare, label: "Solo fatture da pagare/incassare" },
  }[statusFilter];

  const computeValues = () => {
    if (period === "annuale") {
      const ivaDebito = Object.values(selectedData.ivaRicavi).reduce((s, v) => s + v, 0);
      const ivaCredito = Object.values(selectedData.ivaCosti).reduce((s, v) => s + v, 0);
      return { ivaCredito, ivaDebito, ivaNetta: ivaDebito - ivaCredito, label: `Anno ${year}` };
    }

    if (period === "mensile") {
      const months = [selectedMonth];
      const ivaDebito = filterByMonths(selectedData.ivaRicavi, months);
      const ivaCredito = filterByMonths(selectedData.ivaCosti, months);
      return { ivaCredito, ivaDebito, ivaNetta: ivaDebito - ivaCredito, label: `${MONTHS[selectedMonth]} ${year}` };
    }

    const quarter = QUARTERS[selectedQuarter];
    const ivaDebito = filterByMonths(selectedData.ivaRicavi, quarter.months);
    const ivaCredito = filterByMonths(selectedData.ivaCosti, quarter.months);
    return { ivaCredito, ivaDebito, ivaNetta: ivaDebito - ivaCredito, label: `${quarter.label} ${year}` };
  };

  const { ivaCredito, ivaDebito, ivaNetta, label } = computeValues();

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Riepilogo IVA</h3>
          <p className="text-sm text-muted-foreground">Schema sintetico IVA — {label}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Select value={String(year)} onValueChange={(value) => onYearChange(Number(value))}>
            <SelectTrigger className="w-24 h-9">
              <SelectValue placeholder="Anno" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((optionYear) => (
                <SelectItem key={optionYear} value={String(optionYear)}>
                  {optionYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IVAStatusFilter)}>
            <SelectTrigger className="w-[220px] h-9">
              <SelectValue placeholder="Stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="totale">Tutte le fatture</SelectItem>
              <SelectItem value="pagate">Pagate / Incassate</SelectItem>
              <SelectItem value="da_pagare">Da pagare / Incassare</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-muted/40">
            {(["mensile", "trimestrale", "annuale"] as IVAPeriod[]).map((p) => (
              <Button
                key={p}
                variant={period === p ? "default" : "ghost"}
                size="sm"
                className="h-7 px-3 text-xs capitalize"
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {period === "mensile" && (
        <div className="flex flex-wrap gap-1.5">
          {MONTHS.map((m, i) => (
            <Button
              key={i}
              variant={selectedMonth === i ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setSelectedMonth(i)}
            >
              {m}
            </Button>
          ))}
        </div>
      )}
      {period === "trimestrale" && (
        <div className="flex flex-wrap gap-1.5">
          {QUARTERS.map((q, i) => (
            <Button
              key={i}
              variant={selectedQuarter === i ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-3"
              onClick={() => setSelectedQuarter(i)}
            >
              {q.label}
            </Button>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>· Filtro stato attivo: <strong>{selectedData.label}</strong></p>
        <p>· IVA a debito: somma IVA delle fatture <strong>emesse</strong> nel periodo selezionato</p>
        <p>· IVA a credito: somma IVA delle fatture <strong>ricevute</strong> nel periodo selezionato</p>
        <p>· “Pagate / Incassate” considera gli stati <strong>paid</strong> e <strong>matched</strong></p>
        <p>· Se il saldo è positivo → IVA netta da versare al fisco; se negativo → credito IVA a favore dell'azienda</p>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">IVA a debito (fatture emesse)</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">IVA a credito (fatture ricevute)</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Saldo IVA netto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-3 font-medium text-destructive">{fmt(ivaDebito)}</td>
              <td className="py-2 px-3 font-medium text-success">{fmt(ivaCredito)}</td>
              <td className={`py-2 px-3 font-bold ${ivaNetta >= 0 ? "text-success" : "text-destructive"}`}>
                {fmt(ivaNetta)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
