import { ArrowDownLeft, ArrowUpRight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const scadenze = [
  { id: 1, data: "20/12/2024", tipo: "incasso", descrizione: "Fattura #1456 - Cliente ABC", importo: 8500, stato: "in scadenza" },
  { id: 2, data: "22/12/2024", tipo: "pagamento", descrizione: "Rata leasing auto aziendale", importo: 650, stato: "programmato" },
  { id: 3, data: "23/12/2024", tipo: "incasso", descrizione: "Fattura #1460 - Cliente XYZ", importo: 12300, stato: "in scadenza" },
  { id: 4, data: "27/12/2024", tipo: "pagamento", descrizione: "Stipendi dicembre", importo: 28500, stato: "programmato" },
  { id: 5, data: "30/12/2024", tipo: "pagamento", descrizione: "Affitto uffici", importo: 3200, stato: "programmato" },
  { id: 6, data: "02/01/2025", tipo: "incasso", descrizione: "Acconto progetto DEF", importo: 15000, stato: "previsto" },
  { id: 7, data: "05/01/2025", tipo: "pagamento", descrizione: "Fornitori vari", importo: 8900, stato: "programmato" },
  { id: 8, data: "10/01/2025", tipo: "incasso", descrizione: "Fattura #1465 - Cliente GHI", importo: 6700, stato: "previsto" },
];

const liquidityForecast = [
  { data: "18/12", saldo: 128450, min: 10000 },
  { data: "20/12", saldo: 136950, min: 10000 },
  { data: "22/12", saldo: 136300, min: 10000 },
  { data: "23/12", saldo: 148600, min: 10000 },
  { data: "27/12", saldo: 120100, min: 10000 },
  { data: "30/12", saldo: 116900, min: 10000 },
  { data: "02/01", saldo: 131900, min: 10000 },
  { data: "05/01", saldo: 123000, min: 10000 },
  { data: "10/01", saldo: 129700, min: 10000 },
];

export default function Scadenzario() {
  const incassiTotali = scadenze.filter(s => s.tipo === "incasso").reduce((acc, s) => acc + s.importo, 0);
  const pagamentiTotali = scadenze.filter(s => s.tipo === "pagamento").reduce((acc, s) => acc + s.importo, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Scadenzario</h1>
        <p className="text-muted-foreground mt-1">
          Gestione incassi e pagamenti futuri
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownLeft className="h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">Incassi Previsti</p>
          </div>
          <p className="text-2xl font-bold text-success">€{incassiTotali.toLocaleString("it-IT")}</p>
          <p className="text-xs text-muted-foreground mt-1">4 scadenze</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">Pagamenti Programmati</p>
          </div>
          <p className="text-2xl font-bold text-destructive">€{pagamentiTotali.toLocaleString("it-IT")}</p>
          <p className="text-xs text-muted-foreground mt-1">4 scadenze</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <p className="text-sm text-muted-foreground">Saldo Minimo Previsto</p>
          </div>
          <p className="text-2xl font-bold text-foreground">€116.900</p>
          <p className="text-xs text-muted-foreground mt-1">Previsto il 30/12</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar-style List */}
        <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h3 className="text-lg font-semibold text-foreground mb-4">Prossime Scadenze</h3>
          <div className="space-y-3">
            {scadenze.map((scadenza, index) => (
              <div
                key={scadenza.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-lg border transition-all hover:bg-secondary/50 opacity-0 animate-slide-in",
                  scadenza.tipo === "incasso" ? "border-success/20" : "border-destructive/20"
                )}
                style={{ animationDelay: `${300 + index * 50}ms` }}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0",
                  scadenza.tipo === "incasso" ? "bg-success/10" : "bg-destructive/10"
                )}>
                  <span className="text-xs text-muted-foreground">{scadenza.data.split("/")[1]}/{scadenza.data.split("/")[0]}</span>
                  <span className={cn(
                    "text-lg font-bold",
                    scadenza.tipo === "incasso" ? "text-success" : "text-destructive"
                  )}>
                    {scadenza.data.split("/")[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{scadenza.descrizione}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {scadenza.tipo === "incasso" ? (
                      <ArrowDownLeft className="h-3 w-3 text-success" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3 text-destructive" />
                    )}
                    <span className="text-xs text-muted-foreground capitalize">{scadenza.tipo}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "font-semibold",
                    scadenza.tipo === "incasso" ? "text-success" : "text-destructive"
                  )}>
                    {scadenza.tipo === "incasso" ? "+" : "-"}€{scadenza.importo.toLocaleString("it-IT")}
                  </p>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs mt-1",
                      scadenza.stato === "in scadenza" && "border-warning/50 text-warning",
                      scadenza.stato === "programmato" && "border-primary/50 text-primary",
                      scadenza.stato === "previsto" && "border-muted-foreground/50"
                    )}
                  >
                    {scadenza.stato}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Liquidity Forecast Chart */}
        <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Previsione Liquidità</h3>
            <p className="text-sm text-muted-foreground">Saldo previsto per data</p>
          </div>
          <div className="h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liquidityForecast} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(174 72% 46%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(174 72% 46%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
                <XAxis
                  dataKey="data"
                  stroke="hsl(215 20% 45%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(215 20% 45%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222 47% 14%)",
                    border: "1px solid hsl(222 47% 22%)",
                    borderRadius: "8px",
                    color: "hsl(210 40% 98%)",
                  }}
                  formatter={(value: number) => [`€${value.toLocaleString("it-IT")}`, "Saldo"]}
                />
                <ReferenceLine y={10000} stroke="hsl(0 72% 51%)" strokeDasharray="5 5" label={{ value: "Soglia min", position: "right", fill: "hsl(0 72% 51%)", fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="saldo"
                  stroke="hsl(174 72% 46%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorForecast)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
