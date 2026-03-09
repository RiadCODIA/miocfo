import { useState } from "react";
import { MonthlyData } from "@/hooks/useContoEconomico";
import { Button } from "@/components/ui/button";

interface IVASectionProps {
  year: number;
  ivaRicavi: MonthlyData;
  ivaCosti: MonthlyData;
}

type IVAPeriod = "annuale" | "trimestrale" | "mensile";

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
  return months.reduce((sum, m) => {
    const key = String(m + 1).padStart(2, "0");
    return sum + (data[key] || 0);
  }, 0);
}

export function IVASection({ year, ivaRicavi, ivaCosti }: IVASectionProps) {
  const [period, setPeriod] = useState<IVAPeriod>("annuale");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.floor(new Date().getMonth() / 3));

  const computeValues = () => {
    // Italian accounting: IVA a debito = IVA sulle vendite (fatture emesse/ricavi)
    //                     IVA a credito = IVA sugli acquisti (fatture ricevute/costi)
    if (period === "annuale") {
      const ivaDebito = Object.values(ivaRicavi).reduce((s, v) => s + v, 0);
      const ivaCredito = Object.values(ivaCosti).reduce((s, v) => s + v, 0);
      return { ivaCredito, ivaDebito, ivaNetta: ivaDebito - ivaCredito, label: `Anno ${year}` };
    } else if (period === "mensile") {
      const months = [selectedMonth];
      const ivaDebito = filterByMonths(ivaRicavi, months);
      const ivaCredito = filterByMonths(ivaCosti, months);
      return { ivaCredito, ivaDebito, ivaNetta: ivaDebito - ivaCredito, label: `${MONTHS[selectedMonth]} ${year}` };
    } else {
      const q = QUARTERS[selectedQuarter];
      const ivaDebito = filterByMonths(ivaRicavi, q.months);
      const ivaCredito = filterByMonths(ivaCosti, q.months);
      return { ivaCredito, ivaDebito, ivaNetta: ivaDebito - ivaCredito, label: `${q.label} ${year}` };
    }
  };

  const { ivaCredito, ivaDebito, ivaNetta, label } = computeValues();

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Riepilogo IVA</h3>
          <p className="text-sm text-muted-foreground">Schema sintetico IVA — {label}</p>
        </div>

        {/* Period Selector */}
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

      {/* Sub-selector for mensile/trimestrale */}
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
        <p>· IVA a credito: somma IVA di tutte le fatture <strong>emesse</strong> nel periodo</p>
        <p>· IVA a debito: somma IVA di tutte le fatture <strong>ricevute</strong> nel periodo</p>
        <p>· Se il saldo è positivo → più IVA da incassare che da versare</p>
        <p>· Se il saldo è negativo → IVA netta da versare al fisco</p>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">IVA a credito (fatture emesse)</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">IVA a debito (fatture ricevute)</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Saldo IVA netto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-3 font-medium text-success">{fmt(ivaCredito)}</td>
              <td className="py-2 px-3 font-medium text-destructive">{fmt(ivaDebito)}</td>
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
