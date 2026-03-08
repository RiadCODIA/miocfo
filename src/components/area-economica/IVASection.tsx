import { MonthlyData } from "@/hooks/useContoEconomico";

interface IVASectionProps {
  year: number;
  ivaRicavi: MonthlyData;
  ivaCosti: MonthlyData;
}

const fmt = (v: number) => `${v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function IVASection({ year, ivaRicavi, ivaCosti }: IVASectionProps) {
  // Per spec: IVA a credito = fatture emesse, IVA a debito = fatture ricevute
  const ivaCredito = Object.values(ivaRicavi).reduce((s, v) => s + v, 0);
  const ivaDebito = Object.values(ivaCosti).reduce((s, v) => s + v, 0);
  const ivaNetta = ivaCredito - ivaDebito;

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Riepilogo IVA</h3>
          <p className="text-sm text-muted-foreground">Schema sintetico IVA — Anno {year}</p>
        </div>
      </div>

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
