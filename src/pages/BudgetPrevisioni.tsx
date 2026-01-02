import { useState } from "react";
import { Plus, Save, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useBudgets, useBudgetComparison, useBudgetVarianceSummary, useUpdateBudget } from "@/hooks/useBudgets";
import { toast } from "sonner";

export default function BudgetPrevisioni() {
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: comparison, isLoading: loadingComparison } = useBudgetComparison();
  const { data: variance, isLoading: loadingVariance } = useBudgetVarianceSummary();
  const updateBudget = useUpdateBudget();

  const [editedValues, setEditedValues] = useState<Record<string, { income?: number; expenses?: number }>>({});

  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

  const handleInputChange = (budgetId: string, field: "income" | "expenses", value: string) => {
    const numValue = parseFloat(value.replace(/[€.,\s]/g, "")) || 0;
    setEditedValues((prev) => ({
      ...prev,
      [budgetId]: {
        ...prev[budgetId],
        [field]: numValue,
      },
    }));
  };

  const handleSave = async () => {
    try {
      for (const [id, values] of Object.entries(editedValues)) {
        if (values.income !== undefined || values.expenses !== undefined) {
          await updateBudget.mutateAsync({
            id,
            predictedIncome: values.income,
            predictedExpenses: values.expenses,
          });
        }
      }
      setEditedValues({});
      toast.success("Budget salvato con successo");
    } catch {
      toast.error("Errore durante il salvataggio");
    }
  };

  const hasChanges = Object.keys(editedValues).length > 0;

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
            {loadingBudgets ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : budgets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center">
                  <div className="text-muted-foreground">
                    <p>Nessun budget definito</p>
                    <p className="text-xs mt-1">Clicca "Inserisci Budget" per iniziare</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              budgets?.map((row, index) => {
                const editedIncome = editedValues[row.id]?.income;
                const editedExpenses = editedValues[row.id]?.expenses;
                const displayIncome = editedIncome ?? row.predictedIncome;
                const displayExpenses = editedExpenses ?? row.predictedExpenses;
                const cashflow = displayIncome - displayExpenses;

                return (
                  <TableRow
                    key={row.id}
                    className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                    style={{ animationDelay: `${200 + index * 50}ms` }}
                  >
                    <TableCell className="font-medium capitalize">{row.monthLabel}</TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="text"
                        defaultValue={formatCurrency(row.predictedIncome)}
                        onChange={(e) => handleInputChange(row.id, "income", e.target.value)}
                        className="w-[120px] ml-auto text-right bg-transparent border-transparent hover:border-border focus:border-primary h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="text"
                        defaultValue={formatCurrency(row.predictedExpenses)}
                        onChange={(e) => handleInputChange(row.id, "expenses", e.target.value)}
                        className="w-[120px] ml-auto text-right bg-transparent border-transparent hover:border-border focus:border-primary h-8"
                      />
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-semibold",
                      cashflow >= 0 ? "text-success" : "text-destructive"
                    )}>
                      {cashflow >= 0 ? "+" : ""}{formatCurrency(cashflow)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
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
                  formatter={(value: number) => formatCurrency(value)}
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
          )}
        </div>
      </div>

      {/* Variance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-0 animate-fade-in" style={{ animationDelay: "400ms" }}>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">Scostamento Negativo</p>
          </div>
          {loadingVariance ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <>
              <p className="text-2xl font-bold text-destructive mt-2">
                -{formatCurrency(variance?.negativeVariance || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {variance?.negativeMonths || 0} mesi sotto budget
              </p>
            </>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">Scostamento Positivo</p>
          </div>
          {loadingVariance ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <>
              <p className="text-2xl font-bold text-success mt-2">
                +{formatCurrency(variance?.positiveVariance || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {variance?.positiveMonths || 0} mesi sopra budget
              </p>
            </>
          )}
        </div>
        <div className="glass rounded-xl p-5">
          <p className="text-sm text-muted-foreground">Scostamento Netto</p>
          {loadingVariance ? (
            <Skeleton className="h-8 w-24 mt-2" />
          ) : (
            <>
              <p className={cn(
                "text-2xl font-bold mt-2",
                (variance?.netVariance || 0) >= 0 ? "text-success" : "text-destructive"
              )}>
                {(variance?.netVariance || 0) >= 0 ? "+" : ""}{formatCurrency(variance?.netVariance || 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {variance?.variancePercent?.toFixed(1) || 0}% vs budget totale
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
