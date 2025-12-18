import { TrendingUp, TrendingDown, Target, Percent } from "lucide-react";
import { KPICard } from "@/components/dashboard/KPICard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const monthlyData = [
  { mese: "Luglio 2024", incassi: 58000, pagamenti: 45000, utile: 13000, cashflow: 13000 },
  { mese: "Agosto 2024", incassi: 42000, pagamenti: 38000, utile: 4000, cashflow: 4000 },
  { mese: "Settembre 2024", incassi: 65000, pagamenti: 52000, utile: 13000, cashflow: 13000 },
  { mese: "Ottobre 2024", incassi: 71000, pagamenti: 48000, utile: 23000, cashflow: 23000 },
  { mese: "Novembre 2024", incassi: 68000, pagamenti: 55000, utile: 13000, cashflow: 13000 },
  { mese: "Dicembre 2024", incassi: 82000, pagamenti: 61000, utile: 21000, cashflow: 21000 },
];

export default function FlussiCassa() {
  const totals = monthlyData.reduce(
    (acc, row) => ({
      incassi: acc.incassi + row.incassi,
      pagamenti: acc.pagamenti + row.pagamenti,
      utile: acc.utile + row.utile,
      cashflow: acc.cashflow + row.cashflow,
    }),
    { incassi: 0, pagamenti: 0, utile: 0, cashflow: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Flussi di Cassa</h1>
        <p className="text-muted-foreground mt-1">
          Controllo di gestione e sostenibilità finanziaria
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Break-Even Point"
          value="€45.000"
          icon={<Target className="h-5 w-5" />}
          variant="warning"
          delay={0}
        />
        <KPICard
          title="Incidenza Costi"
          value="68.2%"
          change={-2.5}
          changeLabel="vs trimestre prec."
          icon={<Percent className="h-5 w-5" />}
          variant="default"
          delay={50}
        />
        <KPICard
          title="Cashflow Cumulativo"
          value="€87.000"
          change={18.3}
          changeLabel="vs anno prec."
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
          delay={100}
        />
        <KPICard
          title="Margine Operativo"
          value="31.8%"
          change={4.2}
          changeLabel="vs trimestre prec."
          icon={<TrendingDown className="h-5 w-5" />}
          variant="success"
          delay={150}
        />
      </div>

      {/* Monthly Table */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Riepilogo Mensile</h3>
          <p className="text-sm text-muted-foreground">Logica di cassa - Aggregazione mensile</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Mese</TableHead>
              <TableHead className="text-muted-foreground text-right">Incassi</TableHead>
              <TableHead className="text-muted-foreground text-right">Pagamenti</TableHead>
              <TableHead className="text-muted-foreground text-right">Utile/Perdita</TableHead>
              <TableHead className="text-muted-foreground text-right">Cashflow Netto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monthlyData.map((row, index) => (
              <TableRow
                key={row.mese}
                className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                style={{ animationDelay: `${300 + index * 50}ms` }}
              >
                <TableCell className="font-medium">{row.mese}</TableCell>
                <TableCell className="text-right text-success font-medium">
                  €{row.incassi.toLocaleString("it-IT")}
                </TableCell>
                <TableCell className="text-right text-destructive font-medium">
                  €{row.pagamenti.toLocaleString("it-IT")}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  row.utile >= 0 ? "text-success" : "text-destructive"
                )}>
                  {row.utile >= 0 ? "+" : "-"}€{Math.abs(row.utile).toLocaleString("it-IT")}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  row.cashflow >= 0 ? "text-success" : "text-destructive"
                )}>
                  {row.cashflow >= 0 ? "+" : "-"}€{Math.abs(row.cashflow).toLocaleString("it-IT")}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow className="border-border bg-secondary/30 font-bold">
              <TableCell>Totale Periodo</TableCell>
              <TableCell className="text-right text-success">
                €{totals.incassi.toLocaleString("it-IT")}
              </TableCell>
              <TableCell className="text-right text-destructive">
                €{totals.pagamenti.toLocaleString("it-IT")}
              </TableCell>
              <TableCell className={cn(
                "text-right",
                totals.utile >= 0 ? "text-success" : "text-destructive"
              )}>
                {totals.utile >= 0 ? "+" : "-"}€{Math.abs(totals.utile).toLocaleString("it-IT")}
              </TableCell>
              <TableCell className={cn(
                "text-right",
                totals.cashflow >= 0 ? "text-success" : "text-destructive"
              )}>
                {totals.cashflow >= 0 ? "+" : "-"}€{Math.abs(totals.cashflow).toLocaleString("it-IT")}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
