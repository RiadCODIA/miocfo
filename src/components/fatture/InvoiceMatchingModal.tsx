import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Calendar, Hash, Building2, Euro, ArrowRight } from "lucide-react";
import { Invoice } from "./InvoiceTable";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  matchScore: number;
}

interface InvoiceMatchingModalProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMatch: (invoiceId: string, transactionId: string) => void;
}

const mockTransactions: Transaction[] = [
  {
    id: "t1",
    date: new Date("2024-01-15"),
    description: "Pagamento fornitore ABC Srl",
    amount: 1250.00,
    matchScore: 95,
  },
  {
    id: "t2",
    date: new Date("2024-01-14"),
    description: "Bonifico a ABC Srl",
    amount: 1250.00,
    matchScore: 88,
  },
  {
    id: "t3",
    date: new Date("2024-01-16"),
    description: "Pagamento fattura gennaio",
    amount: 1245.00,
    matchScore: 72,
  },
];

export function InvoiceMatchingModal({
  invoice,
  open,
  onOpenChange,
  onMatch,
}: InvoiceMatchingModalProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);

  if (!invoice) return null;

  const handleMatch = () => {
    if (selectedTransaction) {
      onMatch(invoice.id, selectedTransaction);
      setSelectedTransaction(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Abbina Fattura</DialogTitle>
          <DialogDescription>
            Seleziona la transazione corrispondente alla fattura
          </DialogDescription>
        </DialogHeader>

        {/* Invoice Summary */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h4 className="font-medium text-foreground">Fattura da abbinare</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Numero:</span>
              <span className="font-medium">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Data:</span>
              <span className="font-medium">
                {invoice.date.toLocaleDateString("it-IT")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Fornitore:</span>
              <span className="font-medium">{invoice.supplier}</span>
            </div>
            <div className="flex items-center gap-2">
              <Euro className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Importo:</span>
              <span className="font-medium">
                {new Intl.NumberFormat("it-IT", {
                  style: "currency",
                  currency: "EUR",
                }).format(invoice.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Matching Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        {/* Suggested Transactions */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Transazioni suggerite</h4>
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {mockTransactions.map((transaction) => (
              <button
                key={transaction.id}
                onClick={() => setSelectedTransaction(transaction.id)}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-colors",
                  selectedTransaction === transaction.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.date.toLocaleDateString("it-IT")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {new Intl.NumberFormat("it-IT", {
                        style: "currency",
                        currency: "EUR",
                      }).format(transaction.amount)}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        transaction.matchScore >= 90
                          ? "bg-success/10 text-success border-success/20"
                          : transaction.matchScore >= 75
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {transaction.matchScore}% match
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleMatch} disabled={!selectedTransaction}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Conferma abbinamento
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
