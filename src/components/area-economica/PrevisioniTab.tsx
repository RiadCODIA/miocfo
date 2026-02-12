import { useState } from "react";
import { Plus, Save, TrendingUp, TrendingDown, Brain, Loader2 } from "lucide-react";
import { CreateBudgetModal } from "@/components/budget/CreateBudgetModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
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
      const aiData = {
        budgets: budgets?.map((b) => ({ name: b.name, amount: b.amount, startDate: b.startDate, endDate: b.endDate })) || [],
        comparison: comparison || [],
        variance: variance || {},
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
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground text-right">Importo Previsto</TableHead>
              <TableHead className="text-muted-foreground text-right">Cashflow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingBudgets ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell><TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell></TableRow>
              ))
            ) : !budgets?.length ? (
              <TableRow><TableCell colSpan={3} className="h-24 text-center text-muted-foreground">Nessun budget. Clicca "Inserisci Budget".</TableCell></TableRow>
            ) : budgets.map((b) => {
              const amt = editedValues[b.id]?.income ?? b.amount;
              return (
                <TableRow key={b.id} className="border-border">
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-right">
                    <Input type="text" defaultValue={formatCurrency(b.amount)} onChange={(e) => handleInputChange(b.id, e.target.value)} className="w-28 ml-auto text-right bg-transparent border-transparent hover:border-border h-8" />
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", amt >= 0 ? "text-success" : "text-destructive")}>
                    {amt >= 0 ? "+" : ""}{formatCurrency(amt)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Chart */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4">Consuntivo vs Previsionale</h3>
        <div className="h-[280px]">
          {loadingComparison ? <Skeleton className="w-full h-full" /> : !comparison?.length ? (
            <p className="text-sm text-muted-foreground text-center pt-20">Nessun dato</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mese" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="consuntivo" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Consuntivo" />
                <Bar dataKey="previsionale" fill="hsl(var(--primary) / 0.4)" radius={[4, 4, 0, 0]} name="Previsionale" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Variance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" /><span className="text-xs text-muted-foreground">Scost. Negativo</span></div>
          {loadingVariance ? <Skeleton className="h-6 w-20 mt-2" /> : <p className="text-lg font-bold text-destructive mt-1">-{formatCurrency(variance?.negativeVariance || 0)}</p>}
        </div>
        <div className="glass rounded-xl p-4">
          <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-success" /><span className="text-xs text-muted-foreground">Scost. Positivo</span></div>
          {loadingVariance ? <Skeleton className="h-6 w-20 mt-2" /> : <p className="text-lg font-bold text-success mt-1">+{formatCurrency(variance?.positiveVariance || 0)}</p>}
        </div>
        <div className="glass rounded-xl p-4">
          <span className="text-xs text-muted-foreground">Scost. Netto</span>
          {loadingVariance ? <Skeleton className="h-6 w-20 mt-2" /> : (
            <p className={cn("text-lg font-bold mt-1", (variance?.netVariance || 0) >= 0 ? "text-success" : "text-destructive")}>
              {(variance?.netVariance || 0) >= 0 ? "+" : ""}{formatCurrency(variance?.netVariance || 0)}
            </p>
          )}
        </div>
      </div>

      <CreateBudgetModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
    </div>
  );
}
