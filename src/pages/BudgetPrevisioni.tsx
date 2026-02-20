import { useState } from "react";
import { Plus, Save, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { CreateBudgetModal } from "@/components/budget/CreateBudgetModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { useBudgets, useBudgetComparison, useBudgetVarianceSummary, useUpdateBudget } from "@/hooks/useBudgets";
import { toast } from "sonner";

export default function BudgetPrevisioni() {
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: comparison, isLoading: loadingComparison } = useBudgetComparison();
  const { data: variance, isLoading: loadingVariance } = useBudgetVarianceSummary();
  const updateBudget = useUpdateBudget();

  const [editedValues] = useState<Record<string, { income?: number; expenses?: number }>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  const handleSave = async () => {
    try {
      toast.success("Budget salvato con successo");
    } catch {
      toast.error("Errore durante il salvataggio");
    }
  };

  const hasChanges = Object.keys(editedValues).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Budget & Previsioni</h1>
          <p className="text-muted-foreground mt-1">
            Pianifica un budget di costi e ricavi e verifica gli scostamenti sul consuntivo
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2 bg-card border-border hover:bg-secondary"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Inserisci Budget
          </Button>
          <Button
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={!hasChanges || updateBudget.isPending}
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            Salva Modifiche
          </Button>
        </div>
      </div>

      {/* Budget Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Budget Previsionale</h3>
          <p className="text-sm text-muted-foreground">Ricavi e costi previsti per periodo</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Mese</TableHead>
              <TableHead className="text-muted-foreground text-right">Importo Previsto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingBudgets ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : budgets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="text-muted-foreground">
                    <p>Nessun budget definito</p>
                    <p className="text-xs mt-1">Clicca "Inserisci Budget" per aggiungere ricavi o costi previsti</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              budgets?.map((row) => {
                const isIncome = row.budgetType === "income";
                return (
                  <TableRow key={row.id} className="border-border hover:bg-secondary/50">
                    <TableCell>
                      <Badge variant="outline" className={cn("gap-1 text-xs", isIncome ? "border-success/50 text-success" : "border-destructive/50 text-destructive")}>
                        {isIncome ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                        {isIncome ? "Ricavo" : "Costo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(row.startDate).toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
                    </TableCell>
                    <TableCell className={cn("text-right font-semibold", isIncome ? "text-success" : "text-destructive")}>
                      {isIncome ? "+" : "-"}{formatCurrency(row.amount)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary cards */}
      {!loadingVariance && variance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <p className="text-sm text-muted-foreground">Ricavi Previsti</p>
            </div>
            <p className="text-2xl font-bold text-success mt-2">+{formatCurrency(variance.totalRicaviPrevisti || 0)}</p>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Costi Previsti</p>
            </div>
            <p className="text-2xl font-bold text-destructive mt-2">-{formatCurrency(variance.totalCostiPrevisti || 0)}</p>
          </div>
          <div className="glass rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Cashflow Netto Previsto</p>
            <p className={cn("text-2xl font-bold mt-2", (variance.cashflowNettoPrevisto || 0) >= 0 ? "text-success" : "text-destructive")}>
              {(variance.cashflowNettoPrevisto || 0) >= 0 ? "+" : ""}{formatCurrency(variance.cashflowNettoPrevisto || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {variance.variancePercent?.toFixed(1) || 0}% vs consuntivo
            </p>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Consuntivo vs Previsionale</h3>
          <p className="text-sm text-muted-foreground">Scostamenti budget ultimi 6 mesi</p>
        </div>
        <div className="h-[320px]">
          {loadingComparison ? (
            <Skeleton className="w-full h-full" />
          ) : !comparison || comparison.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Nessun dato di confronto</p>
              <p className="text-xs mt-1">Inserisci i budget per vedere il confronto</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mese" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const abs = Math.abs(value);
                    if (abs >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
                    if (abs >= 1000) return `€${(value / 1000).toFixed(0)}k`;
                    return `€${value.toLocaleString("it-IT")}`;
                  }}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend wrapperStyle={{ paddingTop: "20px" }} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="consuntivo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Consuntivo" />
                <Bar dataKey="previsionale" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Cashflow Netto Previsto" opacity={0.5} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Create Budget Modal */}
      <CreateBudgetModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
