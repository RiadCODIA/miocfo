import { ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const productsData = [
  { prodotto: "Consulenza Strategica", ricavi: 85000, costiVariabili: 25000, quotaCostiFissi: 15000, margineLordo: 45000, marginePerc: 52.9 },
  { prodotto: "Sviluppo Software", ricavi: 120000, costiVariabili: 48000, quotaCostiFissi: 22000, margineLordo: 50000, marginePerc: 41.7 },
  { prodotto: "Formazione", ricavi: 35000, costiVariabili: 12000, quotaCostiFissi: 8000, margineLordo: 15000, marginePerc: 42.9 },
  { prodotto: "Manutenzione Sistemi", ricavi: 48000, costiVariabili: 18000, quotaCostiFissi: 10000, margineLordo: 20000, marginePerc: 41.7 },
  { prodotto: "Assistenza Tecnica", ricavi: 28000, costiVariabili: 15000, quotaCostiFissi: 6000, margineLordo: 7000, marginePerc: 25.0 },
  { prodotto: "Licenze Software", ricavi: 62000, costiVariabili: 8000, quotaCostiFissi: 12000, margineLordo: 42000, marginePerc: 67.7 },
];

export default function Marginalita() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Marginalità</h1>
        <p className="text-muted-foreground mt-1">
          Analisi redditività prodotti o servizi
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <Select defaultValue="all">
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Anno corrente</SelectItem>
            <SelectItem value="q4">Q4 2024</SelectItem>
            <SelectItem value="q3">Q3 2024</SelectItem>
            <SelectItem value="q2">Q2 2024</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
          <ArrowUpDown className="h-4 w-4" />
          Ordina per marginalità
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Prodotto/Servizio</TableHead>
              <TableHead className="text-muted-foreground text-right">Ricavi</TableHead>
              <TableHead className="text-muted-foreground text-right">Costi Variabili</TableHead>
              <TableHead className="text-muted-foreground text-right">Quota Costi Fissi</TableHead>
              <TableHead className="text-muted-foreground text-right">Margine Lordo</TableHead>
              <TableHead className="text-muted-foreground text-right w-[200px]">Margine %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productsData.map((row, index) => (
              <TableRow
                key={row.prodotto}
                className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                style={{ animationDelay: `${300 + index * 50}ms` }}
              >
                <TableCell className="font-medium">{row.prodotto}</TableCell>
                <TableCell className="text-right text-foreground">
                  €{row.ricavi.toLocaleString("it-IT")}
                </TableCell>
                <TableCell className="text-right text-destructive">
                  €{row.costiVariabili.toLocaleString("it-IT")}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  €{row.quotaCostiFissi.toLocaleString("it-IT")}
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  row.margineLordo >= 0 ? "text-success" : "text-destructive"
                )}>
                  €{row.margineLordo.toLocaleString("it-IT")}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-3 justify-end">
                    <Progress
                      value={row.marginePerc}
                      className="w-[80px] h-2 bg-secondary"
                    />
                    <span className={cn(
                      "font-semibold min-w-[50px]",
                      row.marginePerc >= 40 ? "text-success" : row.marginePerc >= 25 ? "text-warning" : "text-destructive"
                    )}>
                      {row.marginePerc.toFixed(1)}%
                    </span>
                    {row.marginePerc >= 40 ? (
                      <TrendingUp className="h-4 w-4 text-success" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-warning" />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "500ms" }}>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Ricavi Totali</p>
          <p className="text-2xl font-bold text-foreground mt-1">€378.000</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Margine Lordo Totale</p>
          <p className="text-2xl font-bold text-success mt-1">€179.000</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Margine Medio</p>
          <p className="text-2xl font-bold text-primary mt-1">47.4%</p>
        </div>
      </div>
    </div>
  );
}
