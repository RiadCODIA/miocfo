import { useState } from "react";
import { format, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { 
  Receipt, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  Download, 
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  useAllTransactions, 
  usePeriodStats, 
  useBankAccountsList,
  exportTransactionsToCSV,
  type TransactionFilters 
} from "@/hooks/useFatturazione";

export default function Fatturazione() {
  const [filters, setFilters] = useState<TransactionFilters>({
    startDate: subDays(new Date(), 30).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    type: "all",
    page: 1,
    pageSize: 25,
  });
  const [searchInput, setSearchInput] = useState("");

  const { data: transactionsData, isLoading: loadingTransactions } = useAllTransactions(filters);
  const { data: stats, isLoading: loadingStats } = usePeriodStats(filters.startDate, filters.endDate);
  const { data: bankAccounts } = useBankAccountsList();

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleExport = () => {
    if (transactionsData?.transactions) {
      exportTransactionsToCSV(transactionsData.transactions);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" />
            Fatturazione Piattaforma
          </h1>
          <p className="text-muted-foreground mt-1">
            Tutte le transazioni registrate sulla piattaforma
          </p>
        </div>
        <Button onClick={handleExport} disabled={!transactionsData?.transactions?.length}>
          <Download className="h-4 w-4 mr-2" />
          Esporta CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incassi Totali</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600">
                {formatCurrency(stats?.totalIncome || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamenti Totali</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(stats?.totalExpenses || 0)}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Flusso Netto</CardTitle>
            <ArrowUpDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className={cn(
                "text-2xl font-bold",
                (stats?.netFlow || 0) >= 0 ? "text-emerald-600" : "text-destructive"
              )}>
                {formatCurrency(stats?.netFlow || 0)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtri
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Da:</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">A:</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                className="w-40"
              />
            </div>
            <Select
              value={filters.type}
              onValueChange={(value: "all" | "income" | "expense") => 
                setFilters(prev => ({ ...prev, type: value, page: 1 }))
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti</SelectItem>
                <SelectItem value="income">Solo Incassi</SelectItem>
                <SelectItem value="expense">Solo Pagamenti</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.bankAccountId || "all"}
              onValueChange={(value) => 
                setFilters(prev => ({ 
                  ...prev, 
                  bankAccountId: value === "all" ? undefined : value, 
                  page: 1 
                }))
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Banca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le banche</SelectItem>
                {bankAccounts?.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.bank_name} {bank.account_name ? `- ${bank.account_name}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Input
                placeholder="Cerca descrizione..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button variant="secondary" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>
              Transazioni ({transactionsData?.totalCount || 0})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingTransactions ? (
            <div className="space-y-2">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead>Banca</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Importo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsData?.transactions?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nessuna transazione trovata
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactionsData?.transactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {format(new Date(transaction.date), "dd/MM/yyyy", { locale: it })}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {transaction.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.bank_name}</Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.category?.length ? (
                            <Badge variant="secondary" className="text-xs">
                              {transaction.category[0]}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          transaction.amount >= 0 ? "text-emerald-600" : "text-destructive"
                        )}>
                          {transaction.amount >= 0 ? "+" : ""}{formatCurrency(transaction.amount)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {(transactionsData?.totalPages || 0) > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Pagina {transactionsData?.currentPage} di {transactionsData?.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page === 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Precedente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={filters.page === transactionsData?.totalPages}
                      onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    >
                      Successivo
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
