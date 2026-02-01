import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCreateDeadline, useUpdateDeadline, useInvoicesForDeadlines, Deadline, CreateDeadlineInput } from "@/hooks/useDeadlines";
import { useToast } from "@/hooks/use-toast";

interface DeadlineModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deadline?: Deadline | null;
}

export function DeadlineModal({ open, onOpenChange, deadline }: DeadlineModalProps) {
  const { toast } = useToast();
  const createMutation = useCreateDeadline();
  const updateMutation = useUpdateDeadline();
  const { data: invoices } = useInvoicesForDeadlines();

  const isEditing = !!deadline;

  const [description, setDescription] = useState("");
  const [type, setType] = useState<"incasso" | "pagamento">("pagamento");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [invoiceId, setInvoiceId] = useState<string | null>(null);

  // Reset form when modal opens/closes or deadline changes
  useEffect(() => {
    if (open && deadline) {
      setDescription(deadline.description);
      setType(deadline.type);
      setAmount(deadline.amount.toString());
      setDueDate(new Date(deadline.dueDate));
      setInvoiceId(deadline.invoiceId);
    } else if (open && !deadline) {
      setDescription("");
      setType("pagamento");
      setAmount("");
      setDueDate(undefined);
      setInvoiceId(null);
    }
  }, [open, deadline]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      toast({ title: "Errore", description: "Inserisci una descrizione", variant: "destructive" });
      return;
    }

    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast({ title: "Errore", description: "Inserisci un importo valido", variant: "destructive" });
      return;
    }

    if (!dueDate) {
      toast({ title: "Errore", description: "Seleziona una data di scadenza", variant: "destructive" });
      return;
    }

    try {
      if (isEditing && deadline) {
        await updateMutation.mutateAsync({
          id: deadline.id,
          description: description.trim(),
          type,
          amount: parsedAmount,
          dueDate: format(dueDate, "yyyy-MM-dd"),
          invoiceId,
        });
        toast({ title: "Scadenza aggiornata", description: "La scadenza è stata modificata con successo." });
      } else {
        const input: CreateDeadlineInput = {
          description: description.trim(),
          type,
          amount: parsedAmount,
          dueDate: format(dueDate, "yyyy-MM-dd"),
          invoiceId,
        };
        await createMutation.mutateAsync(input);
        toast({ title: "Scadenza creata", description: "La nuova scadenza è stata aggiunta." });
      }
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il salvataggio",
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifica Scadenza" : "Nuova Scadenza"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrizione</Label>
            <Input
              id="description"
              placeholder="Es. Fattura Fornitore ABC"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={type} onValueChange={(v) => setType(v as "incasso" | "pagamento")}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pagamento">Pagamento</SelectItem>
                  <SelectItem value="incasso">Incasso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Importo (€)</Label>
              <Input
                id="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data Scadenza</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd MMMM yyyy", { locale: it }) : "Seleziona data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  locale={it}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invoice">Collega a fattura (opzionale)</Label>
            <Select value={invoiceId || "none"} onValueChange={(v) => setInvoiceId(v === "none" ? null : v)}>
              <SelectTrigger id="invoice">
                <SelectValue placeholder="Seleziona fattura..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nessuna fattura</SelectItem>
                {invoices?.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>
                    {inv.invoice_number} - {inv.supplier_name} (€{Number(inv.amount).toLocaleString("it-IT")})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Annulla
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Salva modifiche" : "Crea scadenza"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
