import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Calendar, Hash, Building2, Euro, ArrowRight, AlertCircle, Tag } from "lucide-react";
import { Invoice } from "./InvoiceTable";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Fixed category lists per the FD specification
const REVENUE_CATEGORIES = [
  "Ricavi da vendite",
  "Ricavi da servizi",
  "Altri ricavi",
  "Oneri bancari",
  "Oneri diversi",
];

const COST_CATEGORIES = [
  "Acquisto materie prime",
  "Energia e carburanti",
  "Lavorazioni di terzi",
  "Provvigioni",
  "Carburanti",
  "Manutenzione",
  "Assicurazioni",
  "Formazione e ricerca",
  "Marketing e pubblicità",
  "Beni di terzi",
  "Canoni Leasing",
  "Consulenze",
  "Altre spese",
  "Oneri bancari",
  "Oneri diversi",
];

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
  onMatch: (invoiceId: string, transactionId: string, categoryId?: string) => void;
}

export function InvoiceMatchingModal({
  invoice,
  open,
  onOpenChange,
  onMatch,
}: InvoiceMatchingModalProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

  // Determine category list based on invoice type
  const isRevenue = invoice?.invoiceType === "income";
  const categoryList = isRevenue ? REVENUE_CATEGORIES : COST_CATEGORIES;

  // Fetch cost_categories to map names to IDs
  useEffect(() => {
    if (!open) return;
    
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('cost_categories')
        .select('id, name')
        .eq('is_active', true);
      
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(cat => { map[cat.name] = cat.id; });
        setCategoryMap(map);
      }
    };
    fetchCategories();
  }, [open]);

  // Fetch and calculate matching transactions when modal opens
  useEffect(() => {
    if (!open || !invoice) {
      setTransactions([]);
      setSelectedTransaction(null);
      setSelectedCategory(null);
      return;
    }

    const fetchTransactions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const invoiceDate = new Date(invoice.date);
        const dateFrom = new Date(invoiceDate);
        dateFrom.setDate(dateFrom.getDate() - 60);
        const dateTo = new Date(invoiceDate);
        dateTo.setDate(dateTo.getDate() + 60);
        
        const minAmount = invoice.amount * 0.7;
        const maxAmount = invoice.amount * 1.3;
        
        const { data, error: fetchError } = await supabase
          .from('bank_transactions')
          .select('*')
          .gte('date', dateFrom.toISOString().split('T')[0])
          .lte('date', dateTo.toISOString().split('T')[0])
          .order('date', { ascending: false })
          .limit(100);

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setTransactions([]);
          setError("Nessuna transazione nel periodo della fattura. Prova a importare transazioni bancarie.");
          return;
        }
        
        const filteredByAmount = data.filter(tx => {
          const txAmount = Math.abs(Number(tx.amount));
          return txAmount >= minAmount && txAmount <= maxAmount;
        });

        const transactionsToScore = filteredByAmount.length > 0 ? filteredByAmount : data;
        
        const scoredTransactions: Transaction[] = transactionsToScore.map(tx => {
          let score = 0;
          const txAmount = Math.abs(Number(tx.amount));
          const invAmount = invoice.amount;

          const amountDiff = Math.abs(txAmount - invAmount);
          const amountPercentDiff = (amountDiff / invAmount) * 100;
          if (amountPercentDiff === 0) score += 60;
          else if (amountPercentDiff <= 0.5) score += 55;
          else if (amountPercentDiff <= 1) score += 50;
          else if (amountPercentDiff <= 2) score += 40;
          else if (amountPercentDiff <= 5) score += 30;
          else if (amountPercentDiff <= 10) score += 20;
          else if (amountPercentDiff <= 20) score += 10;
          else if (amountPercentDiff <= 30) score += 5;

          const txDate = new Date(tx.date);
          const invDate = invoice.date;
          const daysDiff = Math.abs((txDate.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 1) score += 30;
          else if (daysDiff <= 3) score += 25;
          else if (daysDiff <= 7) score += 20;
          else if (daysDiff <= 14) score += 15;
          else if (daysDiff <= 30) score += 10;
          else if (daysDiff <= 60) score += 5;

          const txDesc = (tx.description || '').toLowerCase() + ' ' + (tx.merchant_name || '').toLowerCase();
          const supplierWords = invoice.supplier.toLowerCase().split(/\s+/).filter(w => w.length > 2);
          const matchedWords = supplierWords.filter(word => txDesc.includes(word));
          if (matchedWords.length >= 2) score += 10;
          else if (matchedWords.length === 1) score += 5;

          return {
            id: tx.id,
            date: new Date(tx.date),
            description: tx.merchant_name || tx.description || 'Transazione',
            amount: txAmount,
            matchScore: Math.min(score, 100),
          };
        });

        const sortedTransactions = scoredTransactions
          .filter(t => t.matchScore >= 15)
          .sort((a, b) => b.matchScore - a.matchScore)
          .slice(0, 10);

        setTransactions(sortedTransactions);
        
        if (sortedTransactions.length === 0) {
          setError("Nessuna transazione compatibile trovata. Prova con date più recenti o importi simili.");
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError("Errore nel caricamento delle transazioni.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [open, invoice]);

  if (!invoice) return null;

  const handleMatch = () => {
    if (selectedTransaction) {
      // Resolve category name to ID if available
      const categoryId = selectedCategory ? categoryMap[selectedCategory] || undefined : undefined;
      onMatch(invoice.id, selectedTransaction, categoryId);
      setSelectedTransaction(null);
      setSelectedCategory(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Abbina Fattura</DialogTitle>
          <DialogDescription>
            Seleziona la transazione e la categoria per la fattura
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

        {/* Category Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4 text-muted-foreground" />
            Categoria {isRevenue ? "(Ricavo)" : "(Costo)"}
          </Label>
          <Select value={selectedCategory || ""} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Seleziona categoria..." />
            </SelectTrigger>
            <SelectContent>
              {categoryList.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Matching Arrow */}
        <div className="flex justify-center">
          <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90" />
        </div>

        {/* Suggested Transactions */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground">Transazioni suggerite</h4>
          
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-lg text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {transactions.map((transaction) => (
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
                          transaction.matchScore >= 80
                            ? "bg-success/10 text-success border-success/20"
                            : transaction.matchScore >= 50
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
          )}
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
