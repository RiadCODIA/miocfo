import { useState } from "react";
import { Search, Filter, Download, Edit2, BarChart3, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useTransactions, useBankAccounts } from "@/hooks/useTransactions";
import { useCategorizeTransactions, CategorizationResult } from "@/hooks/useCategorizeTransactions";
import { CategoryBadge } from "@/components/transazioni/CategoryBadge";
import { CategoryModal } from "@/components/transazioni/CategoryModal";
import { SpendingReportModal } from "@/components/transazioni/SpendingReportModal";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface CostCategory {
  id: string;
  name: string;
}

export default function Transazioni() {
  const [searchTerm, setSearchTerm] = useState("");
  const [period, setPeriod] = useState<"all" | "today" | "week" | "month">("all");
  const [accountId, setAccountId] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<CategorizationResult | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data: transactions, isLoading, refetch } = useTransactions({
    searchTerm,
    period,
    accountId,
    category,
  });

  const { data: accounts } = useBankAccounts();
  const { categorizeBatch, categorize, isLoading: isCategorizing } = useCategorizeTransactions();

  // Fetch cost categories for mapping
  const { data: costCategories } = useQuery({
    queryKey: ["cost-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cost_categories")
        .select("id, name")
        .eq("is_active", true);
      if (error) throw error;
      return data as CostCategory[];
    },
  });

  // Map category IDs to names
  const getCategoryName = (categoryId?: string) => {
    if (!categoryId || !costCategories) return null;
    const cat = costCategories.find((c) => c.id === categoryId);
    return cat?.name || null;
  };

  // Count uncategorized transactions
  const uncategorizedCount = transactions?.filter(
    (tx) => !tx.aiCategoryId && !tx.categoryConfirmed
  ).length || 0;

  const handleCategorizeAll = async () => {
    try {
      const results = await categorizeBatch();
      if (results.length > 0) {
        toast.success(`${results.length} transazioni categorizzate con AI`);
        refetch();
      } else {
        toast.info("Nessuna transazione da categorizzare");
      }
    } catch (error) {
      // Error toast already shown by hook
    }
  };

  const handleCategorizeOne = async (transaction: any) => {
    setSelectedTransaction(transaction);
    
    // If already has AI category, just open modal
    if (transaction.aiCategoryId) {
      setAiSuggestion({
        transaction_id: transaction.id,
        category_id: transaction.aiCategoryId,
        category_name: getCategoryName(transaction.aiCategoryId) || "",
        confidence: transaction.aiConfidence || 0,
        reasoning: "Suggerimento AI precedente",
      });
      setCategoryModalOpen(true);
      return;
    }

    // Otherwise, get AI suggestion first
    try {
      const results = await categorize([transaction.id]);
      if (results.length > 0) {
        setAiSuggestion(results[0]);
        refetch();
      }
      setCategoryModalOpen(true);
    } catch (error) {
      // Still open modal even if AI fails
      setCategoryModalOpen(true);
    }
  };

  const getStatoBadge = (pending: boolean) => {
    if (pending) {
      return <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">In attesa</Badge>;
    }
    return <Badge className="bg-success/10 text-success border-success/20 hover:bg-success/20">Completata</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="opacity-0 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Transazioni</h1>
        <p className="text-muted-foreground mt-1">
          Analisi dettagliata dei movimenti bancari
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 opacity-0 animate-fade-in" style={{ animationDelay: "100ms" }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ricerca testuale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i periodi</SelectItem>
            <SelectItem value="today">Oggi</SelectItem>
            <SelectItem value="week">Ultima settimana</SelectItem>
            <SelectItem value="month">Ultimo mese</SelectItem>
          </SelectContent>
        </Select>

        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Conto" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i conti</SelectItem>
            {accounts?.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.account_name || account.bank_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="transfer">Trasferimenti</SelectItem>
            <SelectItem value="payment">Pagamenti</SelectItem>
            <SelectItem value="food">Alimentari</SelectItem>
            <SelectItem value="travel">Viaggi</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary">
          <Filter className="h-4 w-4" />
          Altri filtri
        </Button>

        {/* AI Spending Analysis Button */}
        <Button
          variant="default"
          className="gap-2"
          onClick={() => setReportModalOpen(true)}
        >
          <BarChart3 className="h-4 w-4" />
          Analisi AI Spese
        </Button>

        <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary ml-auto">
          <Download className="h-4 w-4" />
          Esporta
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: "200ms" }}>
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead className="text-muted-foreground">Descrizione</TableHead>
              <TableHead className="text-muted-foreground text-right">Importo</TableHead>
              <TableHead className="text-muted-foreground">Conto</TableHead>
              <TableHead className="text-muted-foreground">Categoria</TableHead>
              <TableHead className="text-muted-foreground">Stato</TableHead>
              <TableHead className="text-muted-foreground w-[100px]">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-border">
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center">
                  <div className="text-muted-foreground">
                    <p>Nessuna transazione trovata</p>
                    <p className="text-xs mt-1">Collega un conto bancario per visualizzare le transazioni</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((tx, index) => (
                <TableRow
                  key={tx.id}
                  className="border-border hover:bg-secondary/50 opacity-0 animate-fade-in"
                  style={{ animationDelay: `${300 + index * 50}ms` }}
                >
                  <TableCell className="font-medium">
                    {format(new Date(tx.date), "dd/MM/yyyy", { locale: it })}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {tx.merchantName || tx.name}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold",
                    tx.amount > 0 ? "text-success" : "text-destructive"
                  )}>
                    {tx.amount > 0 ? "+" : ""}€{Math.abs(tx.amount).toLocaleString("it-IT")}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{tx.bankName}</TableCell>
                  <TableCell>
                    <CategoryBadge
                      categoryName={getCategoryName(tx.aiCategoryId)}
                      confidence={tx.aiConfidence}
                      confirmed={tx.categoryConfirmed}
                      onClick={() => handleCategorizeOne(tx)}
                    />
                  </TableCell>
                  <TableCell>{getStatoBadge(tx.pending)}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 hover:bg-secondary"
                      onClick={() => handleCategorizeOne(tx)}
                    >
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Category Modal */}
      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={(open) => {
          setCategoryModalOpen(open);
          if (!open) {
            setSelectedTransaction(null);
            setAiSuggestion(null);
          }
        }}
        transaction={selectedTransaction}
        aiSuggestion={aiSuggestion}
      />

      {/* Spending Report Modal */}
      <SpendingReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />
    </div>
  );
}
