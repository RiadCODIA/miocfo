import { useState } from "react";
import { Search, Filter, Download, Edit2, BarChart3, Loader2, X, Sparkles } from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import { format as formatDate } from "date-fns";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
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
  const { dateRange } = useDateRange();
  const [accountId, setAccountId] = useState("all");
  const [category, setCategory] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<CategorizationResult | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const [tempMinAmount, setTempMinAmount] = useState<string>("");
  const [tempMaxAmount, setTempMaxAmount] = useState<string>("");
  const [tempTransactionType, setTempTransactionType] = useState<"all" | "income" | "expense">("all");
  const [tempStartDate, setTempStartDate] = useState<string>("");
  const [tempEndDate, setTempEndDate] = useState<string>("");

  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [transactionType, setTransactionType] = useState<"all" | "income" | "expense">("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [useLocalDates, setUseLocalDates] = useState(false);

  const queryClient = useQueryClient();

  const contextStartDate = formatDate(dateRange.from, "yyyy-MM-dd");
  const contextEndDate = formatDate(dateRange.to, "yyyy-MM-dd");

  const effectiveStartDate = useLocalDates ? (startDate || undefined) : contextStartDate;
  const effectiveEndDate = useLocalDates ? (endDate || undefined) : contextEndDate;

  const { data: transactions, isLoading, refetch } = useTransactions({
    searchTerm,
    period: "all",
    accountId,
    category,
    minAmount: minAmount ? parseFloat(minAmount) : undefined,
    maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
    transactionType,
    startDate: effectiveStartDate,
    endDate: effectiveEndDate,
  });
  
  const activeFiltersCount = [
    minAmount,
    maxAmount,
    transactionType !== "all",
    startDate,
    endDate,
  ].filter(Boolean).length;
  
  const applyAdvancedFilters = () => {
    setMinAmount(tempMinAmount);
    setMaxAmount(tempMaxAmount);
    setTransactionType(tempTransactionType);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    if (tempStartDate || tempEndDate) {
      setUseLocalDates(true);
    }
    setFiltersOpen(false);
  };

  const clearAdvancedFilters = () => {
    setTempMinAmount("");
    setTempMaxAmount("");
    setTempTransactionType("all");
    setTempStartDate("");
    setTempEndDate("");
    setMinAmount("");
    setMaxAmount("");
    setTransactionType("all");
    setStartDate("");
    setEndDate("");
    setUseLocalDates(false);
    setFiltersOpen(false);
  };

  const { data: accounts } = useBankAccounts();
  const { isLoading: isCategorizing } = useCategorizeTransactions();

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

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId || !costCategories) return null;
    const cat = costCategories.find((c) => c.id === categoryId);
    return cat?.name || null;
  };

  const uncategorizedCount = transactions?.filter(
    (tx) => !tx.aiCategoryId && !tx.categoryConfirmed
  ).length || 0;

  const handleCategorizeOne = (transaction: any) => {
    setSelectedTransaction(transaction);
    
    if (transaction.aiCategoryId) {
      setAiSuggestion({
        transaction_id: transaction.id,
        category_id: transaction.aiCategoryId,
        category_name: getCategoryName(transaction.aiCategoryId) || "",
        confidence: 0,
        reasoning: "Suggerimento AI precedente",
      });
    } else {
      setAiSuggestion(null);
    }
    
    setCategoryModalOpen(true);
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Transazioni</h1>
        <p className="text-muted-foreground mt-1">
          Analisi dettagliata dei movimenti bancari
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ricerca testuale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>

        <Select value={accountId} onValueChange={setAccountId}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Conto" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="all">Tutti i conti</SelectItem>
            {accounts?.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.name || account.bank_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[180px] bg-card border-border">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border max-h-[300px]">
            <SelectItem value="all">Tutte le categorie</SelectItem>
            <SelectItem value="uncategorized">Non categorizzate</SelectItem>
            {costCategories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Local date override indicator */}
        {useLocalDates && (startDate || endDate) && (
          <Badge variant="secondary" className="gap-1 py-1.5 px-3">
            Date personalizzate
            <X className="h-3 w-3 cursor-pointer" onClick={() => {
              setUseLocalDates(false);
              setStartDate("");
              setEndDate("");
            }} />
          </Badge>
        )}

        <Popover open={filtersOpen} onOpenChange={(open) => {
          if (open) {
            setTempMinAmount(minAmount);
            setTempMaxAmount(maxAmount);
            setTempTransactionType(transactionType);
            setTempStartDate(startDate);
            setTempEndDate(endDate);
          }
          setFiltersOpen(open);
        }}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 bg-card border-border hover:bg-secondary relative">
              <Filter className="h-4 w-4" />
              Altri filtri
              {activeFiltersCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-card border-border p-4" align="start">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Filtri avanzati</h4>
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAdvancedFilters} className="h-8 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Cancella
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Tipo transazione</Label>
                <Select value={tempTransactionType} onValueChange={(v) => setTempTransactionType(v as typeof tempTransactionType)}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">Tutte</SelectItem>
                    <SelectItem value="income">Solo entrate</SelectItem>
                    <SelectItem value="expense">Solo uscite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Importo (€)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={tempMinAmount}
                    onChange={(e) => setTempMinAmount(e.target.value)}
                    className="bg-background border-border"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={tempMaxAmount}
                    onChange={(e) => setTempMaxAmount(e.target.value)}
                    className="bg-background border-border"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-muted-foreground">Intervallo date</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-primary"
                    onClick={() => {
                      setTempStartDate("");
                      setTempEndDate("");
                    }}
                  >
                    Usa filtro globale
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="bg-background border-border text-sm"
                  />
                  <Input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="bg-background border-border text-sm"
                  />
                </div>
              </div>
              
              <Button 
                className="w-full" 
                size="sm"
                onClick={applyAdvancedFilters}
              >
                Applica filtri
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {isCategorizing && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Categorizzazione AI in corso...</span>
          </div>
        )}
        {uncategorizedCount > 0 && !isCategorizing && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground text-sm">
            <Sparkles className="h-4 w-4" />
            <span>{uncategorizedCount} da categorizzare</span>
          </div>
        )}

        <Button
          variant="outline"
          className="gap-2 bg-card border-border hover:bg-secondary"
          onClick={() => setReportModalOpen(true)}
        >
          <BarChart3 className="h-4 w-4" />
          Analisi AI Spese
        </Button>

        <Button
          variant="outline"
          className="gap-2 bg-card border-border hover:bg-secondary ml-auto"
          onClick={() => {
            if (!transactions || transactions.length === 0) {
              toast.error("Nessuna transazione da esportare");
              return;
            }
            const headers = ["Data", "Descrizione", "Importo", "Conto", "Categoria"];
            const rows = transactions.map((tx) => [
              format(new Date(tx.date), "dd/MM/yyyy", { locale: it }),
              (tx.description || tx.merchantName || "").replace(/"/g, '""'),
              tx.amount.toFixed(2).replace(".", ","),
              tx.bankName || "",
              getCategoryName(tx.aiCategoryId) || "Non categorizzata",
            ]);
            const csvContent = [
              headers.join(";"),
              ...rows.map((r) => r.map((v) => `"${v}"`).join(";")),
            ].join("\n");
            const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `transazioni_${format(new Date(), "yyyy-MM-dd")}.csv`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Transazioni esportate con successo");
          }}
        >
          <Download className="h-4 w-4" />
          Esporta
        </Button>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Data</TableHead>
              <TableHead className="text-muted-foreground">Descrizione</TableHead>
              <TableHead className="text-muted-foreground text-right">Importo</TableHead>
              <TableHead className="text-muted-foreground">Conto</TableHead>
              <TableHead className="text-muted-foreground">Categoria</TableHead>
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
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : transactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <div className="text-muted-foreground space-y-3">
                    <p className="font-medium">Nessuna transazione importata</p>
                    <p className="text-sm">
                      Vai su Conti Bancari e premi Sincronizza, oppure carica un estratto conto (PDF/CSV).
                    </p>
                    <div className="flex justify-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = "/conti-bancari"}
                      >
                        Vai a Conti Bancari
                      </Button>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              transactions?.map((tx) => (
                <TableRow
                  key={tx.id}
                  className="border-border hover:bg-secondary/50"
                >
                  <TableCell className="font-medium">
                    {format(new Date(tx.date), "dd/MM/yyyy", { locale: it })}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {tx.description || tx.merchantName || "—"}
                  </TableCell>
                  <TableCell className={cn(
                    "text-right font-semibold whitespace-nowrap",
                    tx.amount >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {tx.amount >= 0 ? "+" : ""}€{Math.abs(tx.amount).toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {tx.bankName || "—"}
                  </TableCell>
                  <TableCell>
                    <CategoryBadge
                      categoryName={getCategoryName(tx.aiCategoryId)}
                      confirmed={tx.categoryConfirmed}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-primary/10"
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

      {/* Modals */}
      <CategoryModal
        open={categoryModalOpen}
        onOpenChange={(open) => {
          setCategoryModalOpen(open);
          if (!open) {
            setSelectedTransaction(null);
            setAiSuggestion(null);
            queryClient.invalidateQueries({ queryKey: ["transactions"] });
          }
        }}
        transaction={selectedTransaction}
        aiSuggestion={aiSuggestion}
      />

      <SpendingReportModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
      />
    </div>
  );
}
