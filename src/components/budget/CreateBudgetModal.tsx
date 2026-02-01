import { useState } from "react";
import { format, addMonths, startOfMonth } from "date-fns";
import { it } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

interface CreateBudgetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateBudgetModal({ open, onOpenChange }: CreateBudgetModalProps) {
  const createBudget = useCreateBudget();
  
  // Generate next 12 months options
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = addMonths(startOfMonth(new Date()), i);
    return {
      value: date.toISOString(),
      label: format(date, "MMMM yyyy", { locale: it }),
    };
  });

  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value);
  const [predictedIncome, setPredictedIncome] = useState("");
  const [predictedExpenses, setPredictedExpenses] = useState("");

  const handleSubmit = async () => {
    const income = parseFloat(predictedIncome.replace(/[€.,\s]/g, "")) || 0;
    const expenses = parseFloat(predictedExpenses.replace(/[€.,\s]/g, "")) || 0;

    if (income <= 0 && expenses <= 0) {
      toast.error("Inserisci almeno un valore per incassi o pagamenti");
      return;
    }

    try {
      await createBudget.mutateAsync({
        month: new Date(selectedMonth),
        predictedIncome: income,
        predictedExpenses: expenses,
      });
      toast.success("Budget creato con successo");
      onOpenChange(false);
      // Reset form
      setPredictedIncome("");
      setPredictedExpenses("");
      setSelectedMonth(monthOptions[0].value);
    } catch (error) {
      toast.error("Errore durante la creazione del budget");
    }
  };

  const formatInputCurrency = (value: string) => {
    const num = parseFloat(value.replace(/[€.,\s]/g, "")) || 0;
    if (num === 0) return "";
    return `€${num.toLocaleString("it-IT")}`;
  };

  const cashflowPrevisto = (
    (parseFloat(predictedIncome.replace(/[€.,\s]/g, "")) || 0) -
    (parseFloat(predictedExpenses.replace(/[€.,\s]/g, "")) || 0)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Nuovo Budget Mensile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Label htmlFor="income" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Incassi Previsti
            </Label>
            <Input
              id="income"
              type="text"
              placeholder="€0"
              value={predictedIncome}
              onChange={(e) => setPredictedIncome(e.target.value)}
              onBlur={(e) => setPredictedIncome(formatInputCurrency(e.target.value))}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenses" className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-destructive" />
              Pagamenti Previsti
            </Label>
            <Input
              id="expenses"
              type="text"
              placeholder="€0"
              value={predictedExpenses}
              onChange={(e) => setPredictedExpenses(e.target.value)}
              onBlur={(e) => setPredictedExpenses(formatInputCurrency(e.target.value))}
              className="bg-secondary border-border"
            />
          </div>

          {(predictedIncome || predictedExpenses) && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cashflow Previsto</span>
                <span className={`font-semibold ${cashflowPrevisto >= 0 ? "text-success" : "text-destructive"}`}>
                  {cashflowPrevisto >= 0 ? "+" : ""}€{cashflowPrevisto.toLocaleString("it-IT")}
                </span>
              </div>
            </div>
          )}
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
