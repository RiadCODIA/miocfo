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
  const [budgetName, setBudgetName] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");

  const handleSubmit = async () => {
    const cleanedValue = budgetAmount.replace(/[€.\s]/g, "").replace(",", ".");
    const amount = parseFloat(cleanedValue) || 0;

    if (!budgetName.trim()) {
      toast.error("Inserisci un nome per il budget");
      return;
    }

    if (amount === 0) {
      toast.error("Inserisci un importo valido (positivo per ricavi, negativo per costi)");
      return;
    }

    try {
      await createBudget.mutateAsync({
        name: budgetName.trim(),
        amount,
        startDate: new Date(selectedMonth),
        periodType: "monthly",
      });
      toast.success("Budget creato con successo");
      onOpenChange(false);
      // Reset form
      setBudgetName("");
      setBudgetAmount("");
      setSelectedMonth(monthOptions[0].value);
    } catch (error) {
      toast.error("Errore durante la creazione del budget");
    }
  };

  const formatInputCurrency = (value: string) => {
    const cleaned = value.replace(/[€.\s]/g, "").replace(",", ".");
    const num = parseFloat(cleaned) || 0;
    if (num === 0) return "";
    const sign = num < 0 ? "-" : "";
    return `${sign}€${Math.abs(num).toLocaleString("it-IT")}`;
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
            Inserisci l'importo della spesa (con segno meno) o del ricavo (con segno più) che hai previsto per il tuo budget. In questo modo potrai pianificare i costi fissi o i ricavi futuri per monitorarne l'andamento mese per mese.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Budget</Label>
            <Input
              id="name"
              placeholder="Es. Marketing Q1"
              value={budgetName}
              onChange={(e) => setBudgetName(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="month">Mese di inizio</Label>
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
            <Label htmlFor="amount" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              Importo Budget
            </Label>
            <Input
              id="amount"
              type="text"
              placeholder="€0"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              onBlur={(e) => setBudgetAmount(formatInputCurrency(e.target.value))}
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
