import { useState } from "react";
import { Plus, Save, TrendingUp, TrendingDown, Brain, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { CreateBudgetModal } from "@/components/budget/CreateBudgetModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import DashedBar from "@/components/charts/DashedBar";
import { cn } from "@/lib/utils";
import { useBudgets, useBudgetComparison, useBudgetVarianceSummary, useUpdateBudget } from "@/hooks/useBudgets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AIReportSection, type AIReport } from "./AIReportSection";

const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT")}`;

export function PrevisioniTab() {
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: comparison, isLoading: loadingComparison } = useBudgetComparison();
  const { data: variance, isLoading: loadingVariance } = useBudgetVarianceSummary();
  const updateBudget = useUpdateBudget();
  const [editedValues, setEditedValues] = useState<Record<string, { income?: number }>>({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [aiReport, setAiReport] = useState<AIReport | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleInputChange = (budgetId: string, value: string) => {
    const numValue = parseFloat(value.replace(/[€.,\s]/g, "")) || 0;
    setEditedValues((prev) => ({ ...prev, [budgetId]: { income: numValue } }));
  };

  const handleSave = async () => {
    try {
      for (const [id, values] of Object.entries(editedValues)) {
        if (values.income !== undefined) {
          await updateBudget.mutateAsync({ id, amount: values.income });
        }
      }
      setEditedValues({});
      toast.success("Budget salvato con successo");
    } catch {
      toast.error("Errore durante il salvataggio");
    }
  };

  const runAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const ricavi = budgets?.filter(b => b.budgetType === "income") || [];
      const costi = budgets?.filter(b => b.budgetType === "expense") || [];
      const totaleRicaviPrevisti = ricavi.reduce((s, b) => s + b.amount, 0);
      const totaleCostiPrevisti = costi.reduce((s, b) => s + b.amount, 0);
      const cashflowNettoPrevisto = totaleRicaviPrevisti - totaleCostiPrevisti;

      const aiData = {
        contesto: "Questi sono budget PREVISIONALI futuri, non consuntivi passati. Gli scostamenti con consuntivo = 0 indicano mesi futuri non ancora realizzati, NON perdite.",
        budgetsRicavi: ricavi.map(b => ({ nome: b.name, importo: b.amount, mese: b.startDate })),
        budgetsCosti: costi.map(b => ({ nome: b.name, importo: b.amount, mese: b.startDate })),
        totaleRicaviPrevisti,
        totaleCostiPrevisti,
        cashflowNettoPrevisto,
        confrontoMensile: comparison || [],
        scostamenti: variance || {},
      };

      const { data, error } = await supabase.functions.invoke("analyze-conto-economico", {
        body: { type: "previsioni", data: aiData },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setAiReport(data);
    } catch (e) {
      console.error(e);
      toast.error("Errore durante l'analisi AI");
    } finally {
      setAiLoading(false);
    }
  };

  const ricaviBudgets = budgets?.filter(b => b.budgetType === "income") || [];
  const costiBudgets = budgets?.filter(b => b.budgetType === "expense") || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Pianificazione finanziaria futura</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={runAIAnalysis} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
            Analisi AI Previsioni
          </Button>
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4" /> Inserisci Budget
          </Button>
          <Button size="sm" className="gap-2" disabled={!Object.keys(editedValues).length || updateBudget.isPending} onClick={handleSave}>
            <Save className="h-4 w-4" /> Salva
          </Button>
        </div>
      </div>

      {/* AI Report */}
      {aiReport && <AIReportSection report={aiReport} />}

      {/* Budget table */}
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Mese</TableHead>
              <TableHead className="text-muted-foreground text-right">Importo Previsto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingBudgets ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !budgets?.length ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nessun budget. Clicca "Inserisci Budget" per aggiungere ricavi o costi previsti.</TableCell></TableRow>
            ) : budgets.map((b) => {
              const isIncome = b.budgetType === "income";
              return (
                <TableRow key={b.id} className="border-border">
                  <TableCell>
                    <Badge variant="outline" className={cn("gap-1", isIncome ? "border-success/50 text-success" : "border-destructive/50 text-destructive")}>
                      {isIncome ? <ArrowUpCircle className="h-3 w-3" /> : <ArrowDownCircle className="h-3 w-3" />}
                      {isIncome ? "Ricavo" : "Costo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{new Date(b.startDate).toLocaleDateString("it-IT", { month: "long", year: "numeric" })}</TableCell>
                  <TableCell className={cn("text-right font-semibold", isIncome ? "text-success" : "text-destructive")}>
                    {isIncome ? "+" : "-"}{formatCurrency(b.amount)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Summary cards */}
      {!loadingVariance && variance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Ricavi Previsti</span>
            </div>
            <p className="text-lg font-bold text-success">+{formatCurrency(variance.totalRicaviPrevisti || 0)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="h-4 w-4 text-destructive" />
              <span className="text-xs text-muted-foreground">Costi Previsti</span>
            </div>
            <p className="text-lg font-bold text-destructive">-{formatCurrency(variance.totalCostiPrevisti || 0)}</p>
          </div>
          <div className="glass rounded-xl p-4">
            <span className="text-xs text-muted-foreground">Cashflow Netto Previsto</span>
            <p className={cn("text-lg font-bold mt-1", (variance.cashflowNettoPrevisto || 0) >= 0 ? "text-success" : "text-destructive")}>
              {(variance.cashflowNettoPrevisto || 0) >= 0 ? "+" : ""}{formatCurrency(variance.cashflowNettoPrevisto || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Consuntivo vs Previsionale</h3>
        <div className="h-[280px]">
          {loadingComparison ? <Skeleton className="w-full h-full" /> : !comparison?.length ? (
            <p className="text-sm text-muted-foreground text-center pt-20">Nessun dato di confronto disponibile</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison} barSize={11} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 22%)" vertical={false} />
                <XAxis dataKey="mese" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222 47% 14%)", border: "1px solid hsl(222 47% 22%)", borderRadius: "8px", color: "hsl(210 40% 98%)" }} formatter={(v: number) => formatCurrency(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="consuntivo" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} name="Consuntivo" />
                <Bar dataKey="previsionale" name="Cashflow Netto Previsto" shape={<DashedBar color="hsl(142, 71%, 45%)" />} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <CreateBudgetModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
