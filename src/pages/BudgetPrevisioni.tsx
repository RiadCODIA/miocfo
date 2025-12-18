import { useState } from "react";
import { Plus, Save, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";

const budgetData = [
  { mese: "Gen 2025", incassiPrevisti: 75000, pagamentiPrevisti: 55000, cashflowPrevisto: 20000 },
  { mese: "Feb 2025", incassiPrevisti: 68000, pagamentiPrevisti: 52000, cashflowPrevisto: 16000 },
  { mese: "Mar 2025", incassiPrevisti: 82000, pagamentiPrevisti: 58000, cashflowPrevisto: 24000 },
  { mese: "Apr 2025", incassiPrevisti: 71000, pagamentiPrevisti: 54000, cashflowPrevisto: 17000 },
  { mese: "Mag 2025", incassiPrevisti: 78000, pagamentiPrevisti: 56000, cashflowPrevisto: 22000 },
  { mese: "Giu 2025", incassiPrevisti: 85000, pagamentiPrevisti: 60000, cashflowPrevisto: 25000 },
];

const comparisonData = [
  { mese: "Lug", consuntivo: 58000, previsionale: 62000, scostamento: -4000 },
  { mese: "Ago", consuntivo: 42000, previsionale: 48000, scostamento: -6000 },
  { mese: "Set", consuntivo: 65000, previsionale: 60000, scostamento: 5000 },
  { mese: "Ott", consuntivo: 71000, previsionale: 68000, scostamento: 3000 },
  { mese: "Nov", consuntivo: 68000, previsionale: 72000, scostamento: -4000 },
  { mese: "Dic", consuntivo: 82000, previsionale: 78000, scostamento: 4000 },
];

export default function BudgetPrevisioni() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between opacity-0 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget & Previsioni</h1>
          <p className="text-muted-foreground mt-1">
            Pianificazione finanziaria futura
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
            <Plus className="h-4 w-4" />
            Inserisci Budget
          </Button>
          <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Save className="h-4 w-4" />
            Salva Modifiche
          </Button>
        </div>
      </div>

      {/* Editable Budget Table */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Budget Previsionale</h3>
          <p className="text-sm text-muted-foreground">Clicca sulle celle per modificare i valori</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Mese</TableHead>
              <TableHead className="text-muted-foreground text-right">Incassi Previsti</TableHead>
              <TableHead className="text-muted-foreground text-right">Pagamenti Previsti</TableHead>
              <TableHead className="text-muted-foreground text-right">Cashflow Previsto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {budgetData.map((row, index) => (
              <TableRow
                key={row.mese}
                className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                style={{ animationDelay: `${200 + index * 50}ms` }}
              >
                <TableCell className="font-medium">{row.mese}</TableCell>
                <TableCell className="text-right">
                  <Input
                    type="text"
                    defaultValue={`€${row.incassiPrevisti.toLocaleString("it-IT")}`}
                    className="w-[120px] ml-auto text-right bg-transparent border-transparent hover:border-border focus:border-primary h-8"
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Input
                    type="text"
                    defaultValue={`€${row.pagamentiPrevisti.toLocaleString("it-IT")}`}
                    className="w-[120px] ml-auto text-right bg-transparent border-transparent hover:border-border focus:border-primary h-8"
                  />
                </TableCell>
                <TableCell className={cn(
                  "text-right font-semibold",
                  row.cashflowPrevisto >= 0 ? "text-success" : "text-destructive"
                )}>
                  {row.cashflowPrevisto >= 0 ? "+" : ""}€{row.cashflowPrevisto.toLocaleString("it-IT")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Comparison Chart */}
      <div className="glass rounded-xl p-5 opacity-0 animate-fade-in" style={{ animationDelay: "300ms" }}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Consuntivo vs Previsionale</h3>
          <p className="text-sm text-muted-foreground">Scostamenti budget ultimi 6 mesi</p>
        </div>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
              <XAxis
                dataKey="mese"
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
                formatter={(value: number) => `€${value.toLocaleString("it-IT")}`}
              />
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                formatter={(value) => (
                  <span className="text-muted-foreground text-sm capitalize">{value}</span>
                )}
              />
              <ReferenceLine y={0} stroke="hsl(222 47% 30%)" />
              <Bar dataKey="consuntivo" fill="hsl(174 72% 46%)" radius={[4, 4, 0, 0]} name="Consuntivo" />
              <Bar dataKey="previsionale" fill="hsl(174 72% 46% / 0.4)" radius={[4, 4, 0, 0]} name="Previsionale" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Variance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">Scostamento Negativo</p>
          </div>
          <p className="text-2xl font-bold text-destructive mt-2">-€14.000</p>
          <p className="text-xs text-muted-foreground mt-1">3 mesi sotto budget</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">Scostamento Positivo</p>
          </div>
          <p className="text-2xl font-bold text-success mt-2">+€12.000</p>
          <p className="text-xs text-muted-foreground mt-1">3 mesi sopra budget</p>
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Scostamento Netto</p>
          <p className="text-2xl font-bold text-destructive mt-2">-€2.000</p>
          <p className="text-xs text-muted-foreground mt-1">-0.5% vs budget totale</p>
        </div>
      </div>
    </div>
  );
}
