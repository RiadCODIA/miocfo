import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, ArrowUpCircle, ArrowDownCircle, Info, Pencil, Trash2 } from "lucide-react";
import { CreateBudgetModal } from "@/components/budget/CreateBudgetModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";
import { useBudgets, useBudgetChartData, useBudgetVarianceSummary, useUpdateBudget, useDeleteBudget, type Budget } from "@/hooks/useBudgets";
import { toast } from "sonner";
import { format } from "date-fns";

import DashedBar from "@/components/charts/DashedBar";

export default function BudgetPrevisioni() {
  const { data: budgets, isLoading: loadingBudgets } = useBudgets();
  const { data: chartData, isLoading: loadingChart } = useBudgetChartData();
  const { data: variance, isLoading: loadingVariance } = useBudgetVarianceSummary();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editForm, setEditForm] = useState({ name: "", amount: "", budgetType: "income" as "income" | "expense", startDate: "" });
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const formatCurrency = (value: number) => `€${value.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  const openEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setEditForm({
      name: budget.name,
      amount: String(budget.amount),
      budgetType: budget.budgetType,
      startDate: budget.startDate,
    });
  };

  const handleEditSave = async () => {
    if (!editingBudget) return;
    try {
      await updateBudget.mutateAsync({
        id: editingBudget.id,
        name: editForm.name,
        amount: Number(editForm.amount),
        budgetType: editForm.budgetType,
        startDate: editForm.startDate,
      });
      toast.success("Budget aggiornato");
      setEditingBudget(null);
    } catch {
      toast.error("Errore durante l'aggiornamento");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBudget.mutateAsync(deleteId);
      toast.success("Budget eliminato");
      setDeleteId(null);
    } catch {
      toast.error("Errore durante l'eliminazione");
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg text-sm space-y-1">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{
                backgroundColor: entry.color || entry.fill,
                opacity: entry.name?.includes("Previsti") ? 0.5 : 1,
                border: entry.name?.includes("Previsti") ? "1px dashed" : "none",
              }}
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  };

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
        <Button
          variant="outline"
          className="gap-2 bg-card border-border hover:bg-secondary"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Inserisci Budget
        </Button>
      </div>

      {/* Budget Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Budget Previsionale</h3>
          <p className="text-sm text-muted-foreground">Ricavi e costi previsti inseriti manualmente per periodo</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Mese</TableHead>
              <TableHead className="text-muted-foreground text-right">Importo Previsto</TableHead>
              <TableHead className="text-muted-foreground text-right w-[100px]">Azioni</TableHead>
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
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : budgets?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
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
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(row)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-destructive" onClick={() => setDeleteId(row.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </div>
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
              <p className="text-sm text-muted-foreground">Ricavi Attesi</p>
            </div>
            <p className="text-2xl font-bold text-success mt-2">+{formatCurrency(variance.totalRicaviPrevisti || 0)}</p>
            <div className="mt-2 space-y-0.5">
              {variance.ricaviDaBudget > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {formatCurrency(variance.ricaviDaBudget)} da {variance.budgetCount} budget inseriti
                </p>
              )}
              {variance.ricaviDaFatture > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {formatCurrency(variance.ricaviDaFatture)} da fatture emesse non incassate
                </p>
              )}
              {variance.totalRicaviPrevisti === 0 && (
                <p className="text-xs text-muted-foreground">Nessun ricavo previsto o fattura in attesa</p>
              )}
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Costi Attesi</p>
            </div>
            <p className="text-2xl font-bold text-destructive mt-2">-{formatCurrency(variance.totalCostiPrevisti || 0)}</p>
            <div className="mt-2 space-y-0.5">
              {variance.costiDaBudget > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {formatCurrency(variance.costiDaBudget)} da budget inseriti
                </p>
              )}
              {variance.costiDaFatture > 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  {formatCurrency(variance.costiDaFatture)} da fatture ricevute non pagate
                </p>
              )}
              {variance.totalCostiPrevisti === 0 && (
                <p className="text-xs text-muted-foreground">Nessun costo previsto o fattura in attesa</p>
              )}
            </div>
          </div>
          <div className="glass rounded-xl p-5">
            <p className="text-sm text-muted-foreground">Cashflow Netto Previsto</p>
            <p className={cn("text-2xl font-bold mt-2", (variance.cashflowNettoPrevisto || 0) >= 0 ? "text-success" : "text-destructive")}>
              {(variance.cashflowNettoPrevisto || 0) >= 0 ? "+" : ""}{formatCurrency(variance.cashflowNettoPrevisto || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Somma di budget manuali + fatture in attesa di pagamento
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="glass rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">Ricavi e Costi — Effettivi vs Previsti</h3>
          <p className="text-sm text-muted-foreground">
            Barre piene: movimenti bancari effettivi · Barre trasparenti: importi attesi da budget e fatture non pagate
          </p>
        </div>
        <div className="h-[380px]">
          {loadingChart ? (
            <Skeleton className="w-full h-full" />
          ) : !chartData || chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-sm">Nessun dato disponibile</p>
              <p className="text-xs mt-1">I dati appariranno quando ci saranno transazioni, budget o fatture con scadenza</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} barGap={4} barSize={11}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="mese" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => {
                    const abs = Math.abs(value);
                    if (abs >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
                    if (abs >= 1000) return `€${(value / 1000).toFixed(0)}k`;
                    return `€${value.toLocaleString("it-IT")}`;
                  }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: "16px" }}
                  formatter={(value: string) => (
                    <span className="text-xs text-muted-foreground">{value}</span>
                  )}
                />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="ricaviEffettivi" fill="hsl(142, 71%, 45%)" radius={[2, 2, 0, 0]} name="Ricavi Effettivi" />
                <Bar dataKey="ricaviPrevisti" name="Ricavi Previsti" shape={<DashedBar color="hsl(142, 71%, 45%)" />} />
                <Bar dataKey="costiEffettivi" fill="hsl(0, 84%, 60%)" radius={[2, 2, 0, 0]} name="Costi Effettivi" />
                <Bar dataKey="costiPrevisti" name="Costi Previsti" shape={<DashedBar color="hsl(0, 84%, 60%)" />} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Create Budget Modal */}
      <CreateBudgetModal open={createModalOpen} onOpenChange={setCreateModalOpen} />

      {/* Edit Budget Dialog */}
      <Dialog open={!!editingBudget} onOpenChange={(open) => !open && setEditingBudget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Budget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Nome</label>
              <Input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Tipo</label>
              <Select value={editForm.budgetType} onValueChange={(v) => setEditForm(f => ({ ...f, budgetType: v as "income" | "expense" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ricavo</SelectItem>
                  <SelectItem value="expense">Costo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Importo (€)</label>
              <Input type="number" min="0" step="0.01" value={editForm.amount} onChange={(e) => setEditForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Mese</label>
              <Input type="month" value={editForm.startDate ? format(new Date(editForm.startDate), "yyyy-MM") : ""} onChange={(e) => setEditForm(f => ({ ...f, startDate: e.target.value + "-01" }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBudget(null)}>Annulla</Button>
            <Button onClick={handleEditSave} disabled={updateBudget.isPending || !editForm.name || !editForm.amount}>
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare questo budget?</AlertDialogTitle>
            <AlertDialogDescription>Questa azione non può essere annullata.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
