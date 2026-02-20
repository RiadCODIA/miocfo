import { useState } from "react";
import { format, addMonths, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateBudget } from "@/hooks/useBudgets";
import { toast } from "sonner";
import { Loader2, CalendarDays, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBudgetModal({ open, onOpenChange }: CreateBudgetModalProps) {
  const createBudget = useCreateBudget();

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = addMonths(startOfMonth(new Date()), i);
    return {
      value: date.toISOString(),
      label: format(date, "MMMM yyyy", { locale: it }),
    };
  });

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [budgetName, setBudgetName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetType, setBudgetType] = useState<"income" | "expense">("income");

  const handleSubmit = async () => {
    const cleanedValue = budgetAmount.replace(/[€.\s]/g, "").replace(",", ".");
    const amount = Math.abs(parseFloat(cleanedValue) || 0);

    if (!budgetName.trim()) {
      toast.error("Inserisci un nome per il budget");
      return;
    }

    if (amount === 0) {
      toast.error("Inserisci un importo valido");
      return;
    }

    try {
      await createBudget.mutateAsync({
        name: budgetName.trim(),
        amount,
        budgetType,
        startDate: new Date(selectedMonth),
        periodType: "monthly",
      });
      toast.success("Budget creato con successo");
      onOpenChange(false);
      setBudgetName("");
      setBudgetAmount("");
      setSelectedMonth(monthOptions[0].value);
      setBudgetType("income");
    } catch (error) {
      toast.error("Errore durante la creazione del budget");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Nuovo Budget
          </DialogTitle>
          <DialogDescription>
            Inserisci il tipo (ricavo o costo), il nome e l'importo previsto per il mese selezionato.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Budget Type selector */}
          <div className="space-y-2">
            <Label>Tipo</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBudgetType("income")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  budgetType === "income"
                    ? "border-success bg-success/10 text-success"
                    : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                <TrendingUp className="h-4 w-4" />
                Ricavo previsto
              </button>
              <button
                type="button"
                onClick={() => setBudgetType("expense")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
                  budgetType === "expense"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                <TrendingDown className="h-4 w-4" />
                Costo previsto
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder={budgetType === "income" ? "Es. Fatturato atteso" : "Es. Costi marketing"}
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Mese</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {monthOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="capitalize">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Importo (€)
            </Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={createBudget.isPending}>
            {createBudget.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Crea Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
