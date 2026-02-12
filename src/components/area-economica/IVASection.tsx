import { MonthlyData } from "@/hooks/useContoEconomico";

interface IVASectionProps {
  year: number;
  ivaRicavi: MonthlyData;
  ivaCosti: MonthlyData;
}

const fmt = (v: number) => `${v.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

export function IVASection({ year, ivaRicavi, ivaCosti }: IVASectionProps) {
  const totalIvaRicavi = Object.values(ivaRicavi).reduce((s, v) => s + v, 0);
  const totalIvaCosti = Object.values(ivaCosti).reduce((s, v) => s + v, 0);
  const differenza = totalIvaRicavi - totalIvaCosti;
  const aCredito = differenza < 0 ? Math.abs(differenza) : 0;
  const aDebito = differenza > 0 ? differenza : 0;
  const ivaNetta = aDebito - aCredito;

  return (
    <div className="glass rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">IVA Totale</h3>
          <p className="text-sm text-muted-foreground">Calcolo IVA {year}</p>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Anno: <strong className="text-foreground">{year}</strong></span>
          <span>Divisione: <strong className="text-foreground">Mensile</strong></span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>· I ricavi sono calcolati automaticamente dalle fatture emesse</p>
        <p>· I costi sono calcolati automaticamente dalle fatture ricevute dai fornitori</p>
        <p>· I costi del personale devono essere inseriti manualmente</p>
        <p>· Il calcolo IVA è automatico</p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Imponibile {year}</span>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ricavi</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Costi</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">Differenza</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">A credito</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">A debito</th>
              <th className="text-left py-2 px-3 text-muted-foreground font-medium">IVA netta</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2 px-3 font-medium">{fmt(totalIvaRicavi)}</td>
              <td className="py-2 px-3 font-medium">{fmt(totalIvaCosti)}</td>
              <td className="py-2 px-3 font-medium">{fmt(differenza)}</td>
              <td className="py-2 px-3 font-medium text-success">{fmt(aCredito)}</td>
              <td className="py-2 px-3 font-medium text-destructive">{fmt(aDebito)}</td>
              <td className="py-2 px-3 font-bold">={fmt(ivaNetta)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
